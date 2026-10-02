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
            assert quote_links.nth(index).get_attribute("href") == "tel:0840356925"

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
        assert_page_health(page, width)

        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
        primary.locator('a[href="/about"]').click()
        page.wait_for_url(f"{BASE_URL}/about")
        assert page.get_by_role("heading", name="Your Technology Partner. Built Around Your Business.").is_visible()

        page.screenshot(path=str(ARTIFACTS / f"about-{width}.png"), full_page=True)
        if width == 1440:
            page.goto(f"{BASE_URL}/", wait_until="networkidle")
            page.screenshot(path=str(ARTIFACTS / "homepage-1440.png"), full_page=True)

        relevant_errors = [error for error in browser_errors if "favicon" not in error.lower()]
        assert not relevant_errors, f"{width}px console errors: {relevant_errors}"
        context.close()

    browser.close()

print("Browser checks passed at 360, 390, 768, 1024, and 1440px")
