import os
from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000/")
WIDTHS = (360, 390, 768, 1024, 1440)
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)

    for width in WIDTHS:
        context = browser.new_context(viewport={"width": width, "height": 900})
        page = context.new_page()
        browser_errors = []
        page.on("console", lambda message: browser_errors.append(message.text) if message.type == "error" else None)
        page.goto(BASE_URL, wait_until="networkidle")
        page.evaluate("document.fonts.ready")

        overflow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        assert overflow <= 1, f"{width}px viewport overflows horizontally by {overflow}px"

        document_height = page.evaluate("document.body.scrollHeight")
        for y in range(0, document_height + 900, 900):
            page.evaluate("position => window.scrollTo(0, position)", y)
            page.wait_for_timeout(180)
        for image in page.locator("img").all():
            image.scroll_into_view_if_needed()
        page.wait_for_function(
            "Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)",
            timeout=5000,
        )
        broken_images = page.locator("img").evaluate_all(
            "images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src)"
        )
        assert not broken_images, f"{width}px has broken images: {broken_images}"
        page.evaluate("window.scrollTo(0, 0)")

        toggle = page.locator("#menu-toggle")
        navigation = page.locator("#primary-navigation")
        if width < 1024:
            assert toggle.is_visible(), f"mobile menu button hidden at {width}px"
            toggle.click()
            assert toggle.get_attribute("aria-expanded") == "true"
            assert navigation.evaluate("node => node.classList.contains('is-open')")
            assert page.locator("#primary-navigation a").first.evaluate("node => node === document.activeElement")
            page.keyboard.press("Escape")
            assert toggle.get_attribute("aria-expanded") == "false"
            assert toggle.evaluate("node => node === document.activeElement")
        else:
            assert not toggle.is_visible(), f"mobile menu button visible at {width}px"
            assert navigation.is_visible(), f"desktop navigation hidden at {width}px"

        if width in (390, 768, 1024, 1440):
            page.screenshot(path=str(ARTIFACTS / f"homepage-{width}.png"), full_page=True)

        relevant_errors = [error for error in browser_errors if "favicon" not in error.lower()]
        assert not relevant_errors, f"{width}px console errors: {relevant_errors}"
        context.close()

    browser.close()

print("Browser checks passed at 360, 390, 768, 1024, and 1440px")
