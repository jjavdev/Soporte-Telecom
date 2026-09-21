#!/usr/bin/env python3
"""Compila el informe del proyecto en PDF y DOCX.

Ruta: Typst --(PDF)--> informe-soporte.pdf
       Typst --(HTML, features html)--> pandoc --(DOCX)--> informe-soporte.docx

Las imágenes embebidas como data-URI (base64) se decodifican a archivos
temporales para garantizar que queden dentro del .docx.
"""

import base64
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import pypandoc

ROOT = Path(__file__).resolve().parent.parent
REPORT_DIR = ROOT.parent / "docsInformeSoporte"
REPO_DIR = ROOT / "docsInformeSoporte"
MAIN = "informe.typ"
PDF = "informe-soporte.pdf"
DOCX = "informe-soporte.docx"

DATA_URI = re.compile(r'src="data:image/(png|jpeg|jpg|gif|webp|svg\+xml);base64,([^"]+)"')


def build_pdf() -> Path:
    out = REPORT_DIR / PDF
    subprocess.run(["typst", "compile", MAIN, PDF], cwd=REPORT_DIR, check=True)
    print(f"PDF  -> {out}")
    return out


def export_html(dest: Path) -> Path:
    subprocess.run(
        ["typst", "compile", "--features", "html", "-f", "html", MAIN, str(dest)],
        cwd=REPORT_DIR,
        check=True,
    )
    return dest


def inline_images(html: str, tmp: Path) -> str:
    counter = 0

    def replace(match: re.Match) -> str:
        nonlocal counter
        ext = "svg" if match.group(1) == "svg+xml" else match.group(1)
        img = tmp / f"img-{counter}.{ext}"
        img.write_bytes(base64.b64decode(match.group(2)))
        counter += 1
        return f'src="{img}"'

    return DATA_URI.sub(replace, html)


def build_docx() -> Path:
    out = REPORT_DIR / DOCX
    with tempfile.TemporaryDirectory() as tmp_name:
        tmp = Path(tmp_name)
        html_file = export_html(tmp / "informe.html")
        html = inline_images(html_file.read_text(encoding="utf-8"), tmp)
        html_file.write_text(html, encoding="utf-8")
        pypandoc.convert_file(
            str(html_file),
            "docx",
            format="html",
            outputfile=str(out),
            extra_args=["--resource-path", str(tmp), "--shift-heading-level-by=-1"],
        )
    print(f"DOCX -> {out}")
    return out


def main() -> None:
    pdf = build_pdf()
    docx = build_docx()
    REPO_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy(docx, REPO_DIR / DOCX)
    print(f"DOCX -> {REPO_DIR / DOCX} (copia repo)")
    print(f"\nListo: {pdf.name} y {docx.name}")


if __name__ == "__main__":
    main()
