#!/usr/bin/env python3
"""Captura screenshots de la ejecución de los tests automatizados (Vitest).

Ejecuta cada suite de tests, renderiza la salida en una terminal simulada
y guarda un PNG por suite en docsInformeSoporte/assets/test-screenshots/.
"""

import html
import os
import shutil
import subprocess
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(os.path.dirname(__file__)).parent
REPORT_DIR = ROOT.parent / "docsInformeSoporte" / "assets" / "test-screenshots"
REPO_DIR = ROOT / "docsInformeSoporte" / "assets" / "test-screenshots"

TEST_SUITES = [
    ("01-test-auth", ["tests/stores/authStore.test.ts", "tests/hooks/useAuth.test.ts"],
     "Tests de autenticación (RF-001)"),
    ("02-test-tickets", ["tests/hooks/useTickets.test.ts"],
     "Tests de gestión de tickets (RF-001, RF-002, RF-005)"),
    ("03-test-chat", ["tests/hooks/useChat.test.ts"],
     "Tests de chat en tiempo real (RF-012)"),
    ("04-test-componentes-ui", ["tests/components/ui.test.tsx"],
     "Tests de componentes UI base"),
    ("05-test-resumen", [],
     "Ejecución completa de la suite de tests"),
]


def run_vitest(files: list[str]) -> str:
    cmd = ["npm", "run", "test", "--", "--reporter=verbose"]
    cmd.extend(files)
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=300)
    return result.stdout + ("\n" + result.stderr if result.stderr else "")


def colorize(line: str) -> str:
    """Devuelve el HTML de una línea de terminal con su color correspondiente."""
    esc = html.escape(line)
    stripped = line.lstrip()
    if stripped.startswith("✓") or " ✓ " in line:
        return f'<span class="ok">{esc}</span>'
    if stripped.startswith(("×", "✗")) or "FAIL" in line:
        return f'<span class="fail">{esc}</span>'
    if stripped.startswith(("Test Files", "Tests", "Start at", "Duration")):
        return f'<span class="sum">{esc}</span>'
    if stripped.startswith("RUN ") or line.startswith("npm error"):
        return f'<span class="cmd">{esc}</span>'
    if stripped.startswith(">") or stripped.startswith("(!)"):
        return f'<span class="meta">{esc}</span>'
    return f'<span class="txt">{esc}</span>'


def build_page(output: str, title: str) -> str:
    lines = output.splitlines()
    body = "\n".join(colorize(l) for l in lines if l.strip() or l == "")
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  body {{
    margin: 0; padding: 48px;
    background: #0d1117;
    font-family: "SF Mono", "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  }}
  .window {{
    max-width: 1180px; margin: 0 auto;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,.55);
  }}
  .titlebar {{
    display: flex; align-items: center; gap: 8px;
    padding: 12px 16px;
    background: #21262d;
    border-bottom: 1px solid #30363d;
  }}
  .dot {{ width: 12px; height: 12px; border-radius: 50%; }}
  .red {{ background: #ff5f57; }} .yellow {{ background: #febc2e; }} .green {{ background: #28c840; }}
  .title {{
    margin-left: 12px; color: #8b949e; font-size: 13px;
    font-family: -apple-system, "Segoe UI", sans-serif;
  }}
  pre {{
    margin: 0; padding: 24px 28px;
    font-size: 13.5px; line-height: 1.55;
    color: #c9d1d9; white-space: pre;
  }}
  .ok {{ color: #3fb950; }}
  .fail {{ color: #f85149; }}
  .sum {{ color: #58a6ff; font-weight: 700; }}
  .cmd {{ color: #d2a8ff; }}
  .meta {{ color: #8b949e; }}
  .txt {{ color: #c9d1d9; }}
</style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
      <div class="title">{html.escape(title)}</div>
    </div>
    <pre>{body}</pre>
  </div>
</body>
</html>"""


def main() -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    REPO_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=2,
        )
        page = context.new_page()

        for name, files, caption in TEST_SUITES:
            print(f"Ejecutando: {name} ({caption})")
            output = run_vitest(files)
            page.set_content(build_page(output, f"soporte-telecom — {caption}"))
            page.wait_for_timeout(300)
            png_path = REPORT_DIR / f"{name}.png"
            page.screenshot(path=str(png_path), full_page=True)
            shutil.copy(png_path, REPO_DIR / f"{name}.png")
            print(f"  Guardado: {png_path}")

        browser.close()
    print(f"\nCapturas completadas en: {REPORT_DIR}")


if __name__ == "__main__":
    main()
