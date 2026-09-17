#!/usr/bin/env python3
"""Build the adaptive practice chatbot into a single self-contained HTML file.

Splits the master content into topic sections, embeds them alongside the
fallback question bank, and writes dist/ev-drill.html.
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "ev-engineering-handbook.md"
SKIP_SECTIONS = {"0", "13"}   # "How to use this handbook" and the glossary


def chunk(md_path):
    """One chunk per numbered '## ' section. Each chunk is prompted on its own,
    so no single generation call ever sees more than its own section."""
    src = md_path.read_text()
    out = []
    for part in re.split(r"\n(?=## )", src):
        m = re.match(r"## (\d+)\.\s*(.+)", part)
        if not m or m.group(1) in SKIP_SECTIONS:
            continue
        out.append({"id": "s" + m.group(1), "n": int(m.group(1)),
                    "title": m.group(2).strip(), "text": part.strip()})
    return out


def main():
    sections = chunk(CONTENT)
    oversize = [s for s in sections if len(s["text"]) > 60000]
    if oversize:
        sys.exit("section too large for one prompt (64 KiB cap): " +
                 ", ".join(s["id"] for s in oversize))

    subprocess.run([sys.executable, str(ROOT / "src" / "seed.py")],
                   cwd=ROOT / "src", check=True)
    seed = json.loads((ROOT / "src" / "seed.json").read_text())

    html = (ROOT / "src" / "template.html").read_text()
    html = html.replace("/*__CHUNKS__*/", json.dumps(sections, ensure_ascii=False))
    html = html.replace("/*__SEED__*/", json.dumps(seed, ensure_ascii=False))
    assert "__CHUNKS__" not in html and "__SEED__" not in html

    dest = ROOT / "dist" / "ev-drill.html"
    dest.write_text(html)
    print(f"{dest.relative_to(ROOT)}: {len(html):,} bytes, "
          f"{len(sections)} sections, {len(seed)} bank questions")


if __name__ == "__main__":
    main()
