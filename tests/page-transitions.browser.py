import os

from playwright.sync_api import sync_playwright


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4173")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)

    for width in (375, 768, 1280):
        context = browser.new_context(
            viewport={"width": width, "height": 900},
            reduced_motion="no-preference",
        )
        page = context.new_page()
        browser_errors = []
        page.on("console", lambda message: browser_errors.append(message.text) if message.type == "error" else None)

        response = page.goto(f"{BASE_URL}/", wait_until="networkidle")
        assert response and response.ok

        if width < 1024:
            page.get_by_role("button", name="Open menu").click()
            page.wait_for_timeout(850)

        page.locator("#primary-navigation a[href='/about']").click()
        assert page.url == f"{BASE_URL}/about"

        destination_heading = page.get_by_role(
            "heading",
            name="Your Technology Partner. Built Around Your Business.",
        )
        destination_heading.wait_for(state="visible")
        assert page.locator("#home-hero-title").count() == 0
        transition_name = page.locator(".route-transition").evaluate(
            "element => getComputedStyle(element).animationName"
        )
        assert transition_name == "route-enter"
        assert destination_heading.evaluate("element => element === document.activeElement")
        assert page.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 1
        assert not browser_errors, f"{width}px browser errors: {browser_errors}"

        context.close()

    reduced_context = browser.new_context(
        viewport={"width": 1280, "height": 900},
        reduced_motion="reduce",
    )
    reduced_page = reduced_context.new_page()
    reduced_page.goto(f"{BASE_URL}/", wait_until="networkidle")
    reduced_page.locator("#primary-navigation a[href='/about']").click()
    reduced_page.wait_for_timeout(40)
    reduced_transform = reduced_page.locator(".route-transition").evaluate(
        "element => getComputedStyle(element).transform"
    )
    assert reduced_transform in ("none", "matrix(1, 0, 0, 1, 0, 0)")
    reduced_page.get_by_role(
        "heading",
        name="Your Technology Partner. Built Around Your Business.",
    ).wait_for(state="visible")

    reduced_context.close()
    browser.close()

print("Page-transition browser checks passed at 375px, 768px, and 1280px, including reduced motion.")
