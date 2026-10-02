import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4173")
WIDTHS = (360, 390, 768, 1024, 1440)
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)


def assert_page_health(page, width: int) -> None:
    overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    assert overflow <= 1, f"{width}px viewport overflows horizontally by {overflow}px"

    for image in page.locator("img").all():
        image.scroll_into_view_if_needed()
    page.wait_for_function(
        "Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)",
        timeout=10000,
    )
    broken_images = page.locator("img").evaluate_all(
        "images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src)"
    )
    assert not broken_images, f"{width}px has broken images: {broken_images}"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)

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
            assert primary.locator("a").first.evaluate("node => node === document.activeElement")
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
        assert page.get_by_role("heading", name="Powering Your Digital Future.").is_visible()
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/"]').get_attribute("aria-current") == "page"
        assert primary.locator('a[href="/services"]').get_attribute("href") == "/services"
        assert_page_health(page, width)

        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/about"]').click()
        page.wait_for_url(f"{BASE_URL}/about")
        assert page.get_by_role("heading", name="Your Technology Partner. Built Around Your Business.").is_visible()

        page.screenshot(path=str(ARTIFACTS / f"about-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/services"]').click()
        page.wait_for_url(f"{BASE_URL}/services")
        assert page.get_by_role("heading", name="IT Services for Every Business Need.").is_visible()

        response = page.reload(wait_until="networkidle")
        assert response and response.ok, f"/services failed to refresh at {width}px"
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/services"]').get_attribute("aria-current") == "page"
        assert primary.locator('a[href="/"]').get_attribute("href") == "/"

        expected_services = [
            "Hardware Support",
            "Software Solutions",
            "Networking Services",
            "PC & Desktop Support",
            "Microsoft 365 Support",
            "CCTV & Security",
            "Printer Services",
            "Website Development",
        ]
        for service in expected_services:
            assert page.get_by_role("heading", name=service).is_visible()
            assert page.get_by_role("link", name=f"Enquire about {service}").get_attribute("href") == "/contact#request-quote"

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
        primary.locator('a[href="/case-studies"]').click()
        page.wait_for_url(f"{BASE_URL}/case-studies")
        assert page.get_by_role("heading", name="Practical Solutions. Projects in Focus.").is_visible()

        response = page.reload(wait_until="networkidle")
        assert response and response.ok, f"/case-studies failed to refresh at {width}px"
        primary = page.locator("#primary-navigation")
        assert primary.locator('a[href="/case-studies"]').get_attribute("aria-current") == "page"
        assert primary.locator('a[href="/"]').get_attribute("href") == "/"

        expected_projects = [
            "Office Network Setup",
            "Business CCTV Installation",
            "Business Website Design",
            "Workstation & Microsoft 365 Setup",
        ]
        for project in expected_projects:
            assert page.get_by_role("heading", name=project).is_visible()
            assert page.get_by_role("button", name=f"Explore project scope for {project}").is_visible()
        assert page.get_by_text("ILLUSTRATIVE EXAMPLE").count() == 4

        page.get_by_role("button", name="Security").click()
        assert page.get_by_role("button", name="Security").get_attribute("aria-pressed") == "true"
        assert page.get_by_text("Showing 1 illustrative project example.").count() == 1
        assert page.get_by_role("heading", name="Business CCTV Installation").is_visible()
        assert page.get_by_role("heading", name="Office Network Setup").count() == 0

        page.get_by_role("button", name="All Projects").click()
        assert page.get_by_role("heading", name="Office Network Setup").is_visible()

        scope_button = page.get_by_role("button", name="Explore project scope for Office Network Setup")
        scope_button.click()
        dialog = page.get_by_role("dialog", name="Office Network Setup")
        assert dialog.is_visible()
        assert "Network layout, device connections and shared access." in dialog.inner_text()
        assert dialog.get_by_role("link", name="Discuss Your Project").get_attribute("href") == "/contact#request-quote"
        page.keyboard.press("Escape")
        assert dialog.count() == 0
        assert scope_button.evaluate("node => node === document.activeElement")

        assert page.get_by_role("link", name="Discuss Your Project").get_attribute("href") == "/contact#request-quote"
        assert_page_health(page, width)
        page.evaluate("window.scrollTo(0, 0); document.activeElement?.blur()")
        page.screenshot(path=str(ARTIFACTS / f"case-studies-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/faq"]').click()
        page.wait_for_url(f"{BASE_URL}/faq")
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
        send_button.click()
        assert page.locator("#quote-full-name").evaluate("node => node === document.activeElement")
        assert page.get_by_text("Enter your full name.").is_visible()
        assert page.get_by_text("Enter your email address.").is_visible()
        assert page.get_by_text("Enter your phone number.").is_visible()
        assert page.get_by_text("Select a service.").is_visible()
        assert page.get_by_text("Tell us what you need.").is_visible()

        page.get_by_label("Full name").fill("Thandi Ndlovu")
        page.get_by_label("Business name (optional)").fill("Ndlovu Trading")
        page.get_by_label("Email address").fill("thandi@invalid")
        page.get_by_label("Phone number").fill("123")
        page.get_by_label("Service required").select_option("Hardware Support")
        page.get_by_label("Location").fill("Cape Town")
        page.get_by_label("Tell us what you need").fill("Please help us replace three office computers.")
        page.get_by_label("I agree to be contacted about my enquiry.").check()
        send_button.click()
        assert page.get_by_text("Enter a valid email address.").is_visible()
        assert page.get_by_text("Enter a valid phone number.").is_visible()
        assert page.get_by_label("Email address").input_value() == "thandi@invalid"
        assert page.get_by_label("Phone number").input_value() == "123"

        if width == 360:
            page.get_by_label("Email address").fill("thandi@example.com")
            page.get_by_label("Phone number").fill("+27 84 123 4567")
            send_button.click()
            status = page.get_by_role("alert")
            assert "temporarily unavailable" in status.inner_text()
            assert page.get_by_label("Full name").input_value() == "Thandi Ndlovu"
            assert page.get_by_label("Tell us what you need").input_value() == "Please help us replace three office computers."

        page.goto(f"{BASE_URL}/contact#request-quote", wait_until="networkidle")
        assert page.url == f"{BASE_URL}/contact#request-quote"
        quote_card = page.locator("#request-quote")
        assert quote_card.is_visible()
        assert quote_card.evaluate("node => Math.abs(node.getBoundingClientRect().top - 84) < 100")

        page.goto(f"{BASE_URL}/contact", wait_until="networkidle")
        assert_page_health(page, width)
        page.evaluate("window.scrollTo(0, 0); document.activeElement?.blur()")
        page.screenshot(path=str(ARTIFACTS / f"contact-{width}.png"), full_page=True)

        primary = page.locator("#primary-navigation")
        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/"]').click()
        page.wait_for_url(f"{BASE_URL}/")
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

print("Browser checks passed at 360, 390, 768, 1024, and 1440px")
