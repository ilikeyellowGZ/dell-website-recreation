"""Run against a disabled-enquiry preview on port 4173, plus isolated split-origin fixtures.

BASE_URL overrides the preview; SPLIT_API_BASE_URL optionally chooses an unused
http://127.0.0.1:<port> for the local API fixture. No external services are used.
BROWSER_CHANNEL defaults to msedge; use chromium for bundled Chromium.
"""

import os
import re
import socket
import subprocess
import tempfile
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from time import monotonic, sleep
from urllib.parse import urlsplit
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4173")
WIDTHS = (360, 390, 768, 1024, 1440)
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)
ROOT = Path(__file__).resolve().parents[1]


def unused_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return listener.getsockname()[1]


@contextmanager
def local_process(command, environment, ready_url):
    # Separate environments and dynamic ports need custom lifecycle management.
    # Capture fixture output; the production API bootstrap is never run here.
    with tempfile.TemporaryFile(mode="w+", encoding="utf-8") as output:
        process = subprocess.Popen(
            command, cwd=ROOT, env=environment, stdout=output, stderr=subprocess.STDOUT,
        )
        try:
            deadline = monotonic() + 30
            while True:
                if process.poll() is not None:
                    output.seek(0)
                    raise AssertionError(f"Local fixture exited: {output.read()}")
                try:
                    with urlopen(ready_url, timeout=1) as response:
                        if response.status == 200:
                            break
                except OSError:
                    pass
                if monotonic() >= deadline:
                    output.seek(0)
                    raise AssertionError(f"Local fixture did not become ready: {output.read()}")
                sleep(0.1)
            yield
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


class UnapprovedOriginPage(BaseHTTPRequestHandler):
    def do_GET(self):
        body = b"<!doctype html><title>Unapproved local origin</title>"
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        pass


def test_split_origin_enquiry(browser) -> None:
    api_base = os.getenv("SPLIT_API_BASE_URL") or f"http://127.0.0.1:{unused_port()}"
    api = urlsplit(api_base)
    assert (
        api.scheme == "http" and api.hostname == "127.0.0.1" and api.port
        and not api.username and not api.password and not api.path
        and not api.query and not api.fragment
    ), "SPLIT_API_BASE_URL must be http://127.0.0.1:<unused-port> for an isolated fixture"
    frontend_port = unused_port()
    while frontend_port == api.port:
        frontend_port = unused_port()
    frontend_origin = f"http://127.0.0.1:{frontend_port}"
    endpoint = f"{api_base}/api/enquiries"
    environment = {
        key: value for key, value in os.environ.items()
        if not key.startswith(("MONGODB_", "RESEND_", "ADMIN_", "VITE_"))
        and key not in {"JWT_SECRET_KEY", "NODE_ENV", "FRONTEND_ORIGIN", "ENABLE_ENQUIRIES"}
    }
    environment.update({
        "NODE_ENV": "development", "FIXTURE_PORT": str(api.port),
        "FIXTURE_FRONTEND_ORIGIN": frontend_origin,
        "VITE_API_BASE_URL": api_base, "VITE_ENABLE_ENQUIRIES": "true",
        "VITE_DISABLE_REACT_DEVTOOLS": "1",
    })
    # The actual API middleware is used. Only persistence and notification are fakes.
    # This inline-only diagnostics route is never added to the production server.
    fixture = """
        import { createApp } from './server/app.ts';
        const records = [], notifications = [], requests = [];
        const app = createApp({
            allowedOrigins: new Set([process.env.FIXTURE_FRONTEND_ORIGIN]),
            enquiriesEnabled: true,
            enquiryRepository: { insert: async enquiry => { records.push(enquiry); } },
            enquiryNotifier: { notify: async enquiry => { notifications.push(enquiry); } },
        });
        app.get('/__test/state', (_request, response) => response.json({ records, notifications, requests }));
        const server = app.listen(Number(process.env.FIXTURE_PORT), '127.0.0.1');
        server.prependListener('request', (request, response) => {
            if (request.url !== '/api/enquiries') return;
            response.on('finish', () => requests.push({
                method: request.method, origin: request.headers.origin,
                status: response.statusCode, allowedOrigin: response.getHeader('Access-Control-Allow-Origin'),
            }));
        });
    """
    with local_process(
        ["node", "--import", "tsx", "--input-type=module", "-e", fixture],
        environment, f"{api_base}/api/health",
    ), local_process(
        ["node", "node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", str(frontend_port), "--strictPort"],
        environment, frontend_origin,
    ):
        context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        try:
            # Observe without interception: routing can bypass browser preflights.
            requested_urls = []
            context.on("request", lambda request: requested_urls.append(request.url))
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{frontend_origin}/contact#request-quote", wait_until="networkidle")
            page.get_by_role("textbox", name="Full name", exact=True).fill("Split Origin Browser Test")
            page.get_by_role("textbox", name="Email address", exact=True).fill("split-test@example.com")
            page.get_by_role("textbox", name="Phone number", exact=True).fill("084 035 6925")
            page.get_by_role("combobox", name="Service required", exact=True).select_option("Hardware Support")
            page.get_by_role("textbox", name="Tell us what you need", exact=True).fill("Isolated split-origin regression enquiry.")
            page.get_by_role("checkbox", name="I agree to be contacted about my enquiry.").check()
            with page.expect_response(lambda response: response.url == endpoint and response.request.method == "POST") as pending:
                page.get_by_role("button", name="Send Enquiry", exact=True).click()
            response = pending.value
            assert response.status == 201 and response.json() == {"accepted": True}
            assert response.request.all_headers()["origin"] == frontend_origin
            headers = response.all_headers()
            assert headers["access-control-allow-origin"] == frontend_origin
            assert headers["access-control-allow-credentials"] == "true"
            assert "origin" in headers["vary"].lower()
            expect(page.get_by_role("status")).to_contain_text("Your enquiry has been received.")
            state = context.request.get(f"{api_base}/__test/state").json()
            assert len(state["records"]) == len(state["notifications"]) == 1
            assert state["records"][0]["email"] == "split-test@example.com"
            assert {"method": "OPTIONS", "origin": frontend_origin, "status": 204,
                    "allowedOrigin": frontend_origin} in state["requests"], state["requests"]
            assert not errors, f"Allowed split-origin page errors: {errors}"

            unapproved_server = ThreadingHTTPServer(("127.0.0.1", 0), UnapprovedOriginPage)
            unapproved_thread = Thread(target=unapproved_server.serve_forever, daemon=True)
            unapproved_thread.start()
            try:
                unapproved_origin = f"http://127.0.0.1:{unapproved_server.server_port}"
                page.goto(unapproved_origin, wait_until="networkidle")
                # JSON exercises browser preflight rejection; text/plain proves the
                # server also rejects a POST that does not require a preflight.
                for content_type in ("application/json", "text/plain"):
                    result = page.evaluate("""async ({ endpoint, contentType }) => {
                        try {
                            await fetch(endpoint, { method: 'POST', credentials: 'include',
                                headers: { 'content-type': contentType }, body: '{}' });
                            return 'unexpected success';
                        } catch { return 'blocked'; }
                    }""", {"endpoint": endpoint, "contentType": content_type})
                    assert result == "blocked", "Browser must not receive CORS permission for an unapproved origin"
                state = context.request.get(f"{api_base}/__test/state").json()
                rejected = [item for item in state["requests"] if item["origin"] == unapproved_origin]
                assert {item["method"] for item in rejected} == {"OPTIONS", "POST"}
                assert all(item["status"] == 403 and "allowedOrigin" not in item for item in rejected)
                assert len(state["records"]) == len(state["notifications"]) == 1, "Rejected origins must not store or notify"
                assert all(urlsplit(url).hostname == "127.0.0.1" for url in requested_urls), requested_urls
            finally:
                unapproved_server.shutdown()
                unapproved_server.server_close()
                unapproved_thread.join(timeout=5)
        except Exception as error:
            page.screenshot(path=str(ARTIFACTS / "split-origin-failure.png"), full_page=True)
            raise AssertionError(
                f"Split-origin failure at {page.url}; labels={page.locator('label').all_text_contents()}; "
                f"page errors={errors}"
            ) from error
        finally:
            context.close()
    print("Split-origin browser checks passed: configured API, exact Origin/CORS, one insert/notification, rejected preflight and POST")


def assert_page_health(page, width: int) -> None:
    overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 1, f"{width}px viewport overflows horizontally by {overflow}px"

    for image in page.locator("img").all():
        if image.is_visible():
            image.scroll_into_view_if_needed()
        expect(image).to_have_js_property("complete", True, timeout=10000)
    broken_images = page.locator("img").evaluate_all(
        "images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src)"
    )
    assert not broken_images, f"{width}px has broken images: {broken_images}"


def test_service_card_opens_matching_detail_page(page) -> None:
    page.goto(f"{BASE_URL}/services", wait_until="networkidle")
    page.get_by_role("link", name="Explore Hardware Support", exact=True).click()
    expect(page).to_have_url(re.compile(r"/services/hardware-support$"))
    expect(page.get_by_role("heading", name="Hardware Support", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Services", exact=True).first).to_have_attribute("aria-current", "page")
    expect(page.get_by_role("link", name="Request a quote for Hardware Support")).to_have_attribute(
        "href", "/contact#request-quote"
    )
    expect(page.get_by_role("heading", name="Hardware Support", exact=True)).to_be_focused()
    assert page.locator("main").evaluate(
        "node => Math.abs(node.getBoundingClientRect().width - window.innerWidth) <= 1"
    ), "Service detail main must fill the viewport"


def test_mobile_service_detail_and_unknown_route(page) -> None:
    page.goto(f"{BASE_URL}/services/website-development", wait_until="networkidle")
    expect(page.get_by_role("heading", name="Website Development", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="What we can help with", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="Related services", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="Request a quote for Website Development")).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")

    page.goto(f"{BASE_URL}/services/unknown-service", wait_until="networkidle")
    expect(page.get_by_role("heading", name="Service not found", exact=True)).to_be_visible()
    expect(page.get_by_role("link", name="View all services", exact=True)).to_have_attribute("href", "/services")
    expect(page.get_by_role("link", name="Contact our team", exact=True)).to_have_attribute(
        "href", "/contact#request-quote"
    )
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")


def assert_quote_heading_clears_sticky_header(page) -> None:
    tolerance_px = 1
    deadline = monotonic() + 5
    while True:
        geometry = page.evaluate("""() => {
            const heading = document.querySelector('#request-quote h2').getBoundingClientRect();
            const header = document.querySelector('.site-header').getBoundingClientRect();
            return { headingTop: heading.top, headingBottom: heading.bottom,
                headerBottom: header.bottom, viewportHeight: window.innerHeight };
        }""")
        if (
            geometry["headingTop"] >= geometry["headerBottom"] - tolerance_px
            and geometry["headingBottom"] <= geometry["viewportHeight"] + tolerance_px
        ):
            return
        assert monotonic() < deadline, (
            f"Quote heading must be visible below the sticky header (tolerance {tolerance_px}px): {geometry}"
        )
        page.wait_for_timeout(50)


def inspect_service_detail_pages(browser) -> None:
    services = (
        ("hardware-support", "Hardware Support"),
        ("microsoft-365-support", "Microsoft 365 Support"),
        ("website-development", "Website Development"),
        ("unknown-service", "Service not found"),
    )
    for width, height in ((390, 844), (768, 1024), (1440, 900)):
        context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        for slug, title in services:
            response = page.goto(f"{BASE_URL}/services/{slug}", wait_until="networkidle")
            assert response and response.ok, f"{slug} failed to load at {width}px"
            response = page.reload(wait_until="networkidle")
            assert response and response.ok, f"{slug} failed to refresh at {width}px"
            heading = page.get_by_role("heading", level=1, name=title, exact=True)
            expect(heading).to_be_visible()
            expect(heading).to_be_focused()
            expect(page.locator('#primary-navigation a[href="/services"]')).to_have_attribute("aria-current", "page")
            assert heading.evaluate(
                "node => { const box = node.getBoundingClientRect(); return box.left >= 0 && box.right <= window.innerWidth }"
            ), f"{slug} heading clips at {width}px"
            assert_page_health(page, width)
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            page.evaluate("window.scrollTo(0, 0)")
            page.screenshot(path=str(ARTIFACTS / f"service-detail-{slug}-{width}.png"), full_page=True)

            if slug == "unknown-service":
                first_action = page.get_by_role("link", name="View all services", exact=True)
                quote = page.get_by_role("link", name="Contact our team", exact=True)
            else:
                hero_image = page.locator(".service-detail-hero__media img")
                assert hero_image.evaluate("node => getComputedStyle(node).objectFit === 'cover'")
                related = page.locator(".service-detail-related-card a")
                expect(related).to_have_count(3)
                first_action = related.first
                quote = page.get_by_role("link", name=f"Request a quote for {title}", exact=True)
                related_path = first_action.get_attribute("href")
                related_title = first_action.locator("h3").inner_text()
                first_action.click()
                expect(page).to_have_url(f"{BASE_URL}{related_path}")
                expect(page.get_by_role("heading", level=1, name=related_title, exact=True)).to_be_visible()
                page.go_back(wait_until="networkidle")
                expect(heading).to_be_focused()

            # Route-heading focus must lead keyboard users to the first content action.
            page.keyboard.press("Tab")
            expect(first_action).to_be_focused()
            assert first_action.evaluate(
                "node => { const style = getComputedStyle(node); return style.outlineStyle === 'solid' && parseFloat(style.outlineWidth) >= 2 }"
            ), f"{slug} keyboard focus ring missing at {width}px"
            page.screenshot(path=str(ARTIFACTS / f"service-detail-{slug}-{width}-focus.png"))
            if slug == "unknown-service":
                page.keyboard.press("Enter")
                expect(page).to_have_url(f"{BASE_URL}/services")
                expect(page.get_by_role("heading", name="IT Services for Every Business Need.")).to_be_visible()
                page.go_back(wait_until="networkidle")

            expect(quote).to_have_attribute("href", "/contact#request-quote")
            quote.click()
            expect(page).to_have_url(f"{BASE_URL}/contact#request-quote")
            expect(page.locator("#request-quote")).to_be_visible()
            expect(page.get_by_role("heading", name="Request a Quote", exact=True)).to_be_visible()
            assert_quote_heading_clears_sticky_header(page)
        assert not errors, f"Service-detail browser errors at {width}px: {errors}"
        context.close()


with sync_playwright() as playwright:
    browser_channel = os.getenv("BROWSER_CHANNEL", "msedge")
    browser = playwright.chromium.launch(channel=None if browser_channel in ("", "chromium") else browser_channel, headless=True)
    test_split_origin_enquiry(browser)

    detail_context = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    detail_page = detail_context.new_page()
    test_service_card_opens_matching_detail_page(detail_page)
    detail_page.set_viewport_size({"width": 390, "height": 844})
    test_mobile_service_detail_and_unknown_route(detail_page)
    detail_context.close()
    inspect_service_detail_pages(browser)

    for width in WIDTHS:
        context = browser.new_context(viewport={"width": width, "height": 900}, reduced_motion="reduce")
        page = context.new_page()
        browser_errors = []
        page.on("console", lambda message: browser_errors.append(message.text) if message.type == "error" else None)

        response = page.goto(f"{BASE_URL}/about", wait_until="networkidle")
        assert response and response.ok, f"/about failed to load at {width}px"
        page.evaluate("document.fonts.ready")
        page.reload(wait_until="networkidle")
        assert page.get_by_role("heading", name="Your Technology Partner. Built Around Your Business.").is_visible()

        primary = page.locator("#primary-navigation")
        about_link = primary.locator('a[href="/about"]')
        home_link = primary.locator('a[href="/"]')
        assert about_link.get_attribute("aria-current") == "page"
        assert home_link.get_attribute("href") == "/"

        quote_links = page.locator('a.button:has-text("Request a Quote")')
        for index in range(quote_links.count()):
            assert quote_links.nth(index).get_attribute("href") == "/contact#request-quote"

        assert_page_health(page, width)
        page.evaluate("window.scrollTo(0, 0)")

        toggle = page.get_by_role("button", name="Open menu")
        if width < 1024:
            assert toggle.is_visible(), f"mobile menu button hidden at {width}px"
            toggle.click()
            assert page.get_by_role("button", name="Close menu").get_attribute("aria-expanded") == "true"
            assert primary.get_attribute("class") and "is-open" in primary.get_attribute("class")
            try:
                expect(primary.locator("a").first).to_be_focused()
            except AssertionError as error:
                active_element = page.evaluate("document.activeElement?.outerHTML")
                raise AssertionError(f"{width}px focus stayed on {active_element}") from error
            page.keyboard.press("Escape")
            toggle = page.get_by_role("button", name="Open menu")
            assert toggle.get_attribute("aria-expanded") == "false"
            assert toggle.evaluate("node => node === document.activeElement")

            toggle.click()
            primary.locator('a[href="/"]').click()
        else:
            assert not toggle.is_visible(), f"mobile menu button visible at {width}px"
            assert primary.is_visible(), f"desktop navigation hidden at {width}px"
            home_link.click()

        page.wait_for_url(f"{BASE_URL}/")
        page.get_by_role("heading", name="Powering Your Digital Future.").wait_for(state="visible")
        assert page.get_by_role("heading", name="Powering Your Digital Future.").is_visible()
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/"]').get_attribute("aria-current") == "page"
        assert primary.locator('a[href="/services"]').get_attribute("href") == "/services"
        assert_page_health(page, width)

        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/about"]').click()
        page.wait_for_url(f"{BASE_URL}/about")
        page.get_by_role("heading", name="Your Technology Partner. Built Around Your Business.").wait_for(
            state="visible"
        )
        assert page.get_by_role("heading", name="Your Technology Partner. Built Around Your Business.").is_visible()

        page.screenshot(path=str(ARTIFACTS / f"about-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/services"]').click()
        page.wait_for_url(f"{BASE_URL}/services")
        page.get_by_role("heading", name="IT Services for Every Business Need.").wait_for(state="visible")
        assert page.get_by_role("heading", name="IT Services for Every Business Need.").is_visible()

        response = page.reload(wait_until="networkidle")
        assert response and response.ok, f"/services failed to refresh at {width}px"
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/services"]').get_attribute("aria-current") == "page"
        assert primary.locator('a[href="/"]').get_attribute("href") == "/"

        expected_services = [
            ("Hardware Support", "hardware-support"),
            ("Software Solutions", "software-solutions"),
            ("Networking Services", "networking-services"),
            ("PC & Desktop Support", "pc-desktop-support"),
            ("Microsoft 365 Support", "microsoft-365-support"),
            ("CCTV & Security", "cctv-security"),
            ("Printer Services", "printer-services"),
            ("Website Development", "website-development"),
        ]
        for service, slug in expected_services:
            assert page.get_by_role("heading", name=service).is_visible()
            action = page.get_by_role("link", name=f"Explore {service}", exact=True)
            expect(action).to_have_text(f"Explore {service}")
            expect(action).to_have_attribute("href", f"/services/{slug}")

        assert page.get_by_role("link", name="Talk to Us").get_attribute("href") == "/contact#request-quote"
        assert page.locator('a[href="/services.html"]').count() == 0
        assert_page_health(page, width)
        page.evaluate("window.scrollTo(0, 0); document.activeElement?.blur()")
        page.screenshot(path=str(ARTIFACTS / f"services-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/solutions"]').click()
        page.wait_for_url(f"{BASE_URL}/solutions")
        page.get_by_role("heading", name="Technology Solutions Built Around Your Business.").wait_for(
            state="visible"
        )
        assert page.get_by_role("heading", name="Technology Solutions Built Around Your Business.").is_visible()

        response = page.reload(wait_until="networkidle")
        assert response and response.ok, f"/solutions failed to refresh at {width}px"
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/solutions"]').get_attribute("aria-current") == "page"
        solution_titles = [
            "For small businesses",
            "For growing businesses",
            "For businesses with IT issues",
            "For businesses moving to cloud",
            "For businesses needing better security",
            "For businesses needing a stronger digital presence",
        ]
        for title in solution_titles:
            assert page.get_by_role("heading", name=title).is_visible()
        assert page.get_by_role("link", name="Talk to Gauvis").get_attribute("href") == "/contact#request-quote"
        assert page.get_by_role("link", name="Call 084 035 6925").get_attribute("href") == "tel:+27840356925"
        assert page.get_by_text("Privacy Policy").count() == 0
        assert page.get_by_text("Terms & Conditions").count() == 0
        assert_page_health(page, width)
        page.evaluate("window.scrollTo(0, 0); document.activeElement?.blur()")
        page.screenshot(path=str(ARTIFACTS / f"solutions-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/faq"]').click()
        page.wait_for_url(f"{BASE_URL}/faq")
        page.get_by_role("heading", name="Clear Answers. Confident Decisions.").wait_for(state="visible")
        assert page.get_by_role("heading", name="Clear Answers. Confident Decisions.").is_visible()

        response = page.reload(wait_until="networkidle")
        assert response and response.ok, f"/faq failed to refresh at {width}px"
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/faq"]').get_attribute("aria-current") == "page"
        assert primary.locator('a[href="/"]').get_attribute("href") == "/"

        first_faq = page.get_by_role("button", name="What services do you offer?")
        assert first_faq.get_attribute("aria-expanded") == "true"
        assert page.get_by_text("We assist with hardware repairs").is_visible()
        support_faq = page.get_by_role("button", name="Do you provide on-site support?")
        assert support_faq.get_attribute("aria-expanded") == "false"
        support_faq.click()
        assert support_faq.get_attribute("aria-expanded") == "true"
        assert page.get_by_text("Gauvis Tech provides on-site assistance").is_visible()

        page.get_by_role("button", name="Quotes").click()
        assert page.get_by_role("button", name="Quotes").get_attribute("aria-pressed") == "true"
        assert page.get_by_role("heading", name="Quotes questions").is_visible()
        assert page.get_by_role("button", name="How do I request a quote?").is_visible()

        page.get_by_label("Search questions").fill("printer")
        assert page.get_by_role("button", name="What services do you offer?").is_visible()
        page.get_by_label("Search questions").fill("zzzz")
        assert page.get_by_text("No questions match your search.").is_visible()
        page.get_by_role("button", name="Clear search").click()
        assert page.get_by_role("button", name="How do I request a quote?").is_visible()

        assert page.get_by_role("link", name="Contact Us").get_attribute("href") == "/contact"
        assert page.get_by_role("link", name="WhatsApp Us").get_attribute("href") == "https://wa.me/27840356925"
        quote_hrefs = page.get_by_role("link", name="Request a Quote").evaluate_all(
            "links => links.map(link => link.getAttribute('href'))"
        )
        assert "/contact#request-quote" in quote_hrefs
        assert_page_health(page, width)
        page.evaluate("window.scrollTo(0, 0); document.activeElement?.blur()")
        page.screenshot(path=str(ARTIFACTS / f"faq-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/contact"]').click()
        page.wait_for_url(f"{BASE_URL}/contact")
        page.get_by_role("heading", name="Let’s Talk About Your IT Needs.").wait_for(state="visible")
        assert page.get_by_role("heading", name="Let’s Talk About Your IT Needs.").is_visible()

        response = page.reload(wait_until="networkidle")
        assert response and response.ok, f"/contact failed to refresh at {width}px"
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/contact"]').get_attribute("aria-current") == "page"
        assert primary.locator('a[href="/"]').get_attribute("href") == "/"
        assert page.locator('a[href="tel:+27840356925"]').count() >= 2
        assert page.locator('a[href="tel:+27643670274"]').count() >= 2
        assert page.locator('a[href^="mailto:"]').count() == 0
        assert page.get_by_role("link", name="Chat on WhatsApp").get_attribute("href") == "https://wa.me/27840356925"

        send_button = page.get_by_role("button", name="Send Enquiry")
        assert send_button.is_disabled()
        assert page.get_by_text("Online enquiries are not open yet.").is_visible()
        assert page.locator("#request-quote fieldset").get_attribute("disabled") is not None
        assert page.locator("#enquiry-unavailable a[href='tel:+27840356925']").is_visible()
        assert page.locator("#enquiry-unavailable a[href='https://wa.me/27840356925']").is_visible()

        page.goto(f"{BASE_URL}/contact#request-quote", wait_until="networkidle")
        assert page.url == f"{BASE_URL}/contact#request-quote"
        quote_card = page.locator("#request-quote")
        assert quote_card.is_visible()
        assert_quote_heading_clears_sticky_header(page)

        page.goto(f"{BASE_URL}/contact", wait_until="networkidle")
        assert_page_health(page, width)
        page.evaluate("window.scrollTo(0, 0); document.activeElement?.blur()")
        page.screenshot(path=str(ARTIFACTS / f"contact-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/"]').click()
        page.wait_for_url(f"{BASE_URL}/")
        page.get_by_role("heading", name="Powering Your Digital Future.").wait_for(state="visible")
        assert page.get_by_role("heading", name="Powering Your Digital Future.").is_visible()

        if width == 1440:
            page.screenshot(path=str(ARTIFACTS / "homepage-1440.png"), full_page=True)

        relevant_errors = [
            error
            for error in browser_errors
            if "favicon" not in error.lower() and "503 (Service Unavailable)" not in error
        ]
        assert not relevant_errors, f"{width}px console errors: {relevant_errors}"
        context.close()

    browser.close()

print("Browser checks passed at 360, 390, 768, 1024, and 1440px; service detail journeys passed at 390x844, 768x1024, and 1440x900")
