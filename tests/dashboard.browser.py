"""Visual smoke test for the built admin dashboard with isolated API responses."""

import json
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)
ENQUIRIES = [
    {
        "businessName": "Ndlovu Trading", "createdAt": "2026-10-16T08:00:00.000Z",
        "email": "thandi@example.com", "fullName": "Thandi Ndlovu", "location": "Cape Town",
        "message": "Three office computers need replacement.", "phone": "+27 84 123 4567",
        "service": "Hardware Support", "status": "new",
    },
    {
        "businessName": "Moyo Studio", "createdAt": "2026-10-15T08:00:00.000Z",
        "email": "moyo@example.com", "fullName": "Ayo Moyo", "location": "Windhoek",
        "message": "Our team needs Microsoft 365 migration.", "phone": "+27 84 222 2222",
        "service": "Microsoft 365 Support", "status": "new",
    },
]


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    for width in (390, 1440):
        page = browser.new_page(viewport={"width": width, "height": 900})
        cors = {"access-control-allow-origin": "http://127.0.0.1:4173", "access-control-allow-credentials": "true"}
        def serve_preview_document(route):
            response = route.fetch()
            headers = {key: value for key, value in response.headers.items() if key.lower() != "content-security-policy"}
            route.fulfill(response=response, headers=headers)
        page.route("http://127.0.0.1:4173/admin/enquiries", serve_preview_document)
        page.route("**/api/health", lambda route: route.fulfill(status=200, content_type="application/json", body='{"status":"ok"}'))
        page.route("**/api/admin/session", lambda route: route.fulfill(status=200, headers=cors, content_type="application/json", body='{"authenticated":true}'))
        page.route("**/api/admin/enquiries", lambda route: route.fulfill(status=200, headers=cors, content_type="application/json", body=json.dumps({"enquiries": ENQUIRIES})))
        page.goto("http://127.0.0.1:4173/admin/enquiries")
        expect(page.get_by_role("heading", name="Enquiries dashboard")).to_be_visible()
        expect(page.get_by_role("table", name="All enquiries")).to_be_visible()
        assert page.evaluate("""(needsScroll) => {
            const scroller = document.querySelector('.admin-table-scroll');
            return scroller.getBoundingClientRect().right <= innerWidth &&
                (!needsScroll || scroller.scrollWidth > scroller.clientWidth) &&
                getComputedStyle(scroller).overflowX === 'auto';
        }""", width == 390)
        page.screenshot(path=str(ARTIFACTS / f"admin-dashboard-{width}.png"), full_page=True)
        page.get_by_role("searchbox", name="Search enquiries").fill("migration")
        expect(page.get_by_role("row", name="Ayo Moyo", exact=False)).to_be_visible()
        expect(page.get_by_role("row", name="Thandi Ndlovu", exact=False)).to_have_count(0)
        page.close()
    browser.close()
