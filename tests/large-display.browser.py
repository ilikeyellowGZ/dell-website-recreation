import os

from playwright.sync_api import sync_playwright


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4173")
ROUTES = ("/", "/about", "/services", "/solutions", "/faq", "/contact")


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    measurements = {}
    context = browser.new_context(viewport={"width": 1440, "height": 1080})
    page = context.new_page()

    for width in (1440, 1920, 2560):
        page.set_viewport_size({"width": width, "height": 1080})
        response = page.goto(f"{BASE_URL}/", wait_until="load")
        assert response and response.ok
        page.locator("#home-hero-title").wait_for(state="visible")

        measurements[width] = page.evaluate(
            """() => ({
                root: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
                button: Number.parseFloat(getComputedStyle(document.querySelector('.button')).fontSize),
                heading: Number.parseFloat(getComputedStyle(document.querySelector('#home-hero-title')).fontSize),
                paragraph: Number.parseFloat(getComputedStyle(document.querySelector('.home-about__copy p')).fontSize),
            })"""
        )

        assert page.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 1

    assert measurements[1440]["root"] == 16
    assert measurements[1920]["root"] >= 18
    assert measurements[2560]["root"] >= 21
    for metric in ("button", "heading", "paragraph"):
        assert measurements[1920][metric] > measurements[1440][metric]
        assert measurements[2560][metric] > measurements[1920][metric]

    for width, expected_columns in ((390, 1), (1024, 2), (1440, 2), (1920, 3)):
        page.set_viewport_size({"width": width, "height": 1080})
        response = page.goto(f"{BASE_URL}/services", wait_until="load")
        assert response and response.ok
        catalogue = page.locator(".service-catalogue__grid")
        catalogue.wait_for(state="visible")
        rendered_columns = catalogue.evaluate(
            "element => getComputedStyle(element).gridTemplateColumns.split(' ').length"
        )
        assert rendered_columns == expected_columns, (
            f"Expected {expected_columns} service columns at {width}px, got {rendered_columns}."
        )

    page.set_viewport_size({"width": 1920, "height": 1080})
    for route in ROUTES:
        response = page.goto(f"{BASE_URL}{route}", wait_until="load")
        assert response and response.ok, f"{route} failed to load at 1920px"
        page.locator("main h1").wait_for(state="visible")
        assert page.evaluate("document.documentElement.scrollWidth - window.innerWidth") <= 1
        assert page.locator("main h1").is_visible()

    context.close()
    browser.close()

print("Large-display scaling checks passed at 1440px, 1920px, and 2560px across all routes.")
