#!/usr/bin/env python3
"""Retire le fond studio hexagonal des rendus 3D (rembg / u2net)."""
from pathlib import Path

from rembg import remove

ROOT = Path(__file__).resolve().parents[1] / "public" / "collection" / "s01" / "_3d-renders"


def process(path: Path) -> None:
    path.write_bytes(remove(path.read_bytes()))
    print("ok", path.parent.name, path.name)


def main() -> None:
    clips = sorted(p for p in ROOT.glob("clip-*") if p.is_dir())
    total = sum(1 for c in clips for _ in c.glob("*.png"))
    done = 0
    for clip in clips:
        for png in sorted(clip.glob("*.png")):
            process(png)
            done += 1
            print(f"  [{done}/{total}]")
    print(f"Terminé — {done} images traitées.")


if __name__ == "__main__":
    main()
