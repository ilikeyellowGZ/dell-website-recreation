import os

from playwright.sync_api import sync_playwright


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:4173")
ADMIN_USERNAME = os.getenv("ADMIN_TEST_USERNAME", "admin")
ADMIN_PASSWORD = os.environ["ADMIN_TEST_PASSWORD"]


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    page = context.new_page()

    response = page.goto(f"{BASE_URL}/admin/login", wait_until="networkidle")
    assert response and response.ok
    assert page.get_by_role("heading", name="Admin sign in").is_visible()

    page.get_by_label("Username").fill("wrong-user")
    page.get_by_label("Password").fill("wrong-password")
    page.get_by_role("button", name="Sign in").click()
    assert page.get_by_role("alert").inner_text() == "Sign-in failed."

    page.get_by_label("Username").fill(ADMIN_USERNAME)
    page.get_by_label("Password").fill(ADMIN_PASSWORD)
    page.get_by_role("button", name="Sign in").click()
    page.wait_for_url(f"{BASE_URL}/admin/enquiries")
    page.get_by_role("heading", name="Website enquiries").wait_for(state="visible")

    cookies = context.cookies()
    session_cookie = next(cookie for cookie in cookies if cookie["name"] == "gauvis_admin_session")
    assert session_cookie["httpOnly"] is True
    assert session_cookie["sameSite"] == "Strict"

    disabled_response = context.request.post(
        f"{BASE_URL}/api/enquiries",
        data={
            "fullName": "Production Browser Test",
            "businessName": "",
            "email": "browser-test@example.com",
            "phone": "+27 84 123 4567",
            "service": "Hardware Support",
            "location": "Cape Town",
            "message": "This request must be rejected while public enquiries are disabled.",
            "consent": True,
        },
        headers={"Origin": BASE_URL},
    )
    assert disabled_response.status == 503
    assert disabled_response.json()["code"] == "ENQUIRIES_DISABLED"

    page.get_by_role("button", name="Sign out").click()
    page.wait_for_url(f"{BASE_URL}/admin/login")
    assert not any(cookie["name"] == "gauvis_admin_session" for cookie in context.cookies())

    context.close()
    browser.close()

print("Admin authentication, secure session, logout, and enquiry lock checks passed.")
