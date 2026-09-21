#!/usr/bin/env python3
"""Captura las pantallas de la app en móvil, tablet y escritorio (mobile-first)."""

import asyncio
import os
import shutil
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("APP_URL", "http://localhost:3000")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORT_DIR = os.path.abspath(os.path.join(ROOT, "..", "docsInformeSoporte", "assets", "responsive"))
REPO_DIR = os.path.join(ROOT, "docsInformeSoporte", "assets", "responsive")

TEST_USER = {"email": "admin@soporte.com", "password": "Admin123!"}

VIEWPORTS = {
    "movil": {"width": 390, "height": 844, "device_scale_factor": 2},
    "tablet": {"width": 768, "height": 1024, "device_scale_factor": 2},
    "escritorio": {"width": 1440, "height": 900, "device_scale_factor": 1},
}

SCREENS = [
    ("01-login", "/login", False),
    ("02-register", "/register", False),
    ("03-dashboard", "/", True),
    ("04-tickets", "/tickets", True),
    ("05-ticket-nuevo", "/tickets/new", True),
    ("06-chat", "/chat", True),
    ("07-knowledge", "/knowledge", True),
    ("08-admin", "/admin", True),
    ("09-admin-usuarios", "/admin/users", True),
    ("10-admin-knowledge", "/admin/knowledge", True),
    ("11-admin-reportes", "/admin/reports", True),
]


async def login(page):
    if await page.locator('input[type="email"]').count() == 0:
        return
    await page.fill('input[type="email"]', TEST_USER["email"])
    await page.fill('input[type="password"]', TEST_USER["password"])
    await page.locator('button[type="submit"]').click()
    try:
        await page.wait_for_url(lambda url: "/login" not in url, timeout=10000)
    except Exception:
        await page.wait_for_timeout(3000)
    await page.wait_for_load_state("networkidle")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for vp_name, vp in VIEWPORTS.items():
            out_dir = os.path.join(REPORT_DIR, vp_name)
            os.makedirs(out_dir, exist_ok=True)
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]}, device_scale_factor=vp["device_scale_factor"])
            page = await context.new_page()
            logged = False
            for name, path, needs_login in SCREENS:
                try:
                    await page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
                    if needs_login and not logged:
                        await login(page)
                        logged = True
                        await page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
                    await page.wait_for_timeout(1800)
                    fp = os.path.join(out_dir, f"{name}.png")
                    await page.screenshot(path=fp, full_page=False)
                    print(f"[{vp_name}] {name} -> {fp}")
                except Exception as e:
                    print(f"[{vp_name}] error en {name}: {e}")
            await context.close()
        await browser.close()

    if os.path.isdir(REPORT_DIR):
        shutil.copytree(REPORT_DIR, REPO_DIR, dirs_exist_ok=True)
        print(f"\nCopiado a {REPO_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
