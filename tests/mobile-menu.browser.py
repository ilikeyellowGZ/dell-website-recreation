import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4173")
ARTIFACTS = Path("artifacts")
ARTIFACTS.mkdir(exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)

    for width, height in ((360, 800), (390, 844), (768, 900)):
        context = browser.new_context(
            viewport={"width": width, "height": height},
            reduced_motion="no-preference",
        )
        page = context.new_page()
        browser_errors = []
        page.on("console", lambda message: browser_errors.append(message.text) if message.type == "error" else None)

        response = page.goto(f"{BASE_URL}/about", wait_until="networkidle")
        assert response and response.ok, f"/about failed to load at {width}px"

        navigation = page.locator("#primary-navigation")
        toggle = page.get_by_role("button", name="Open menu")
        assert navigation.get_attribute("inert") is not None
        assert toggle.is_visible()

        toggle.click()
        page.wait_for_timeout(240)
        reveal_opacities = navigation.locator("[data-mobile-nav-reveal]").evaluate_all(
            "elements => elements.map(element => Number.parseFloat(getComputedStyle(element).opacity).toFixed(2))"
        )
        assert len(set(reveal_opacities)) >= 3, f"{width}px menu items did not cascade"

        page.wait_for_timeout(900)
        drawer = navigation.bounding_box()
        assert drawer is not None
        assert abs(drawer["x"]) <= 1
        assert drawer["width"] <= min(width * 0.88, 384) + 1
        assert navigation.get_attribute("inert") is None
        assert page.get_by_role("button", name="Close navigation menu").is_visible()
        assert page.locator(".mobile-nav__quote").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 1

        page.screenshot(path=str(ARTIFACTS / f"mobile-menu-{width}.png"))

        quote = page.locator(".mobile-nav__quote")
        quote.focus()
        quote.press("Tab")
        assert page.get_by_role("button", name="Close navigation menu").evaluate(
            "element => element === document.activeElement"
        )

        page.keyboard.press("Escape")
        page.wait_for_timeout(550)
        assert toggle.get_attribute("aria-expanded") == "false"
        assert toggle.evaluate("element => element === document.activeElement")
        assert navigation.get_attribute("inert") is not None
        assert not browser_errors, f"{width}px browser errors: {browser_errors}"

        context.close()

    reduced_context = browser.new_context(
        viewport={"width": 390, "height": 844},
        reduced_motion="reduce",
    )
    reduced_page = reduced_context.new_page()
    reduced_page.goto(f"{BASE_URL}/about", wait_until="networkidle")
    reduced_page.get_by_role("button", name="Open menu").click()
    reduced_drawer = reduced_page.locator("#primary-navigation").bounding_box()
    assert reduced_drawer is not None and abs(reduced_drawer["x"]) <= 1
    assert reduced_page.locator("#primary-navigation").evaluate(
        "element => getComputedStyle(element).opacity === '1'"
    )

    reduced_context.close()
    browser.close()

print("Mobile menu browser checks passed at 360px, 390px, and 768px, including reduced motion.")
