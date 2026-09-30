import time
import os
from playwright.sync_api import sync_playwright

output_dir = os.path.abspath("walkthrough")
os.makedirs(output_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    context = browser.new_context(
        viewport={"width": 1440, "height": 900},
        record_video_dir=output_dir,
        record_video_size={"width": 1440, "height": 900}
    )
    
    page = context.new_page()
    
    print("[1/8] Navigating to http://localhost:3000/ ...")
    page.goto("http://localhost:3000/", wait_until="networkidle")
    time.sleep(2)
    
    # Scroll smoothly through the hero & quick stats
    print("[2/8] Showcasing Hero, stats banner, and category chips ...")
    page.mouse.wheel(0, 350)
    time.sleep(2)
    page.mouse.wheel(0, -350)
    time.sleep(1.5)
    
    # Switch roles to demonstrate RBAC persona modes
    print("[3/8] Demonstrating Role Switcher ...")
    try:
        researcher_btn = page.locator("button:has-text('Researcher')").first
        if researcher_btn.is_visible():
            researcher_btn.click()
            time.sleep(2)
            
        farmer_btn = page.locator("button:has-text('Farmer')").first
        if farmer_btn.is_visible():
            farmer_btn.click()
            time.sleep(2)
    except Exception as e:
        print("Role switch note:", e)

    # Search for Potato Chips with realistic typing
    print("[4/8] Typing 'potato chips' in search box ...")
    search_input = page.locator("input[placeholder*='Search']").first
    search_input.click()
    search_input.fill("")
    for ch in "potato chips":
        search_input.type(ch, delay=120)
    time.sleep(2)
    
    # Click the suggestion
    print("[5/8] Selecting suggestion ...")
    try:
        suggestion = page.locator(".search-suggestion, div:has-text('Potato Chips')").last
        if suggestion.is_visible():
            suggestion.click()
        else:
            search_input.press("Enter")
    except Exception:
        search_input.press("Enter")
        
    time.sleep(3)
    
    # Scroll to view top recommendation & score breakdown bars
    print("[6/8] Inspecting recommendation results and score bars ...")
    page.mouse.wheel(0, 450)
    time.sleep(3)
    page.mouse.wheel(0, 450)
    time.sleep(2.5)
    
    # Open Costing Calculator if present
    print("[7/8] Interacting with Costing Engine ...")
    try:
        cost_btn = page.locator("button:has-text('Calculate Live Cost'), button:has-text('Cost')").first
        if cost_btn.is_visible():
            cost_btn.click()
            time.sleep(2.5)
            # Adjust width or MOQ
            moq_input = page.locator("input[type='number']").first
            if moq_input.is_visible():
                moq_input.fill("5000")
                time.sleep(2)
    except Exception as e:
        print("Costing note:", e)

    # Open Digital Packaging Passport QR
    print("[8/8] Generating Digital Packaging Passport QR ...")
    try:
        dpp_btn = page.locator("button:has-text('Digital Packaging Passport'), button:has-text('Passport'), button:has-text('QR')").first
        if dpp_btn.is_visible():
            dpp_btn.click()
            time.sleep(3)
    except Exception as e:
        print("DPP note:", e)

    time.sleep(3)
    page.close()
    context.close()
    
    video_path = page.video.path() if page.video else None
    browser.close()
    print("Video recording completed successfully!")
    print("Video saved at:", video_path)
