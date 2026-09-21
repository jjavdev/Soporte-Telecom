#!/usr/bin/env python3
"""Captura screenshots de la aplicación Soporte Telecom."""

import asyncio
import os
import shutil
from playwright.async_api import async_playwright

BASE_URL = os.environ.get("APP_URL", "http://localhost:3000")
REPO_DIR = os.path.join(os.path.dirname(__file__), "..", "docsInformeSoporte", "assets", "screenshots")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "docsInformeSoporte", "assets", "screenshots")

# Credenciales de prueba (usuarios seed)
TEST_USER = {"email": "admin@soporte.com", "password": "Admin123!"}

SCREENSHOTS = [
    {"name": "01-login", "path": "/login", "wait": 2000},
    {"name": "02-register", "path": "/register", "wait": 2000},
    {"name": "03-dashboard-cliente", "path": "/", "wait": 3500, "login": True},
    {"name": "04-crear-ticket", "path": "/tickets/new", "wait": 2000, "login": True},
    {"name": "05-chat", "path": "/chat", "wait": 2000, "login": True},
    {"name": "06-knowledge", "path": "/knowledge", "wait": 2000, "login": True},
    {"name": "07-admin-dashboard", "path": "/admin", "wait": 3000, "login": True},
    {"name": "08-admin-users", "path": "/admin/users", "wait": 2000, "login": True},
    {"name": "09-admin-knowledge", "path": "/admin/knowledge", "wait": 2000, "login": True},
    {"name": "10-admin-reports", "path": "/admin/reports", "wait": 2000, "login": True},
]


async def login(page):
    """Login con credenciales de prueba."""
    await page.goto(f"{BASE_URL}/login")
    await page.wait_for_timeout(1000)

    email_input = page.locator('input[type="email"]')
    password_input = page.locator('input[type="password"]')

    if await email_input.count() > 0:
        await email_input.fill(TEST_USER["email"])
        await password_input.fill(TEST_USER["password"])
        await page.locator('button[type="submit"]').click()
        try:
            await page.wait_for_url(lambda url: "/login" not in url, timeout=10000)
        except Exception:
            await page.wait_for_timeout(3000)
        await page.wait_for_load_state("networkidle")


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(REPO_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            device_scale_factor=2,
        )
        page = await context.new_page()

        logged_in = False

        for shot in SCREENSHOTS:
            try:
                if shot.get("login") and not logged_in:
                    await login(page)
                    logged_in = True

                url = f"{BASE_URL}{shot['path']}"
                print(f"Capturando: {shot['name']} -> {url}")
                await page.goto(url, wait_until="networkidle")
                await page.wait_for_timeout(shot.get("wait", 2000))

                filepath = os.path.join(OUTPUT_DIR, f"{shot['name']}.png")
                await page.screenshot(path=filepath, full_page=False)
                shutil.copy(filepath, os.path.join(REPO_DIR, f"{shot['name']}.png"))
                print(f"  Guardado: {filepath}")

            except Exception as e:
                print(f"  Error en {shot['name']}: {e}")

        await browser.close()
    print(f"\nCapturas completadas en: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
