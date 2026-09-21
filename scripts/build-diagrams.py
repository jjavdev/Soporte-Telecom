#!/usr/bin/env python3
"""Compila los diagramas Typst (diagrams/*.typ) a PNG en assets/diagrams/."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIAG = ROOT.parent / "docsInformeSoporte" / "diagrams"
OUT = ROOT.parent / "docsInformeSoporte" / "assets" / "diagrams"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    files = [f for f in sorted(DIAG.glob("*.typ")) if not f.name.startswith("_")]
    for f in files:
        out = OUT / f"{f.stem}.png"
        subprocess.run(
            ["typst", "compile", "--format", "png", "--ppi", "300", f.name, str(out)],
            cwd=DIAG,
            check=True,
        )
        print(f"OK  {out.name}")
    print(f"\n{len(files)} diagramas en {OUT}")


if __name__ == "__main__":
    main()
