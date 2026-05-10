"""
Regenerate the favicon set from android-chrome-512x512.png.

The source artwork has heavy transparent padding around the "TA" mark, which
makes it look tiny in the browser tab. This script crops to the alpha bounding
box, adds a small consistent margin (~6% of the cropped size), then re-exports
every favicon size and a multi-resolution .ico.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FAV_DIR = ROOT / "public" / "favicon"
SRC = FAV_DIR / "android-chrome-512x512.png"

# Margin around the trimmed mark, as a fraction of the trimmed size.
MARGIN_RATIO = 0.06
# Alpha values at or below this are treated as background. The source artwork
# has faint alpha=1 noise extending to the full canvas, so a plain getbbox()
# would refuse to trim. 32 is well below any visible stroke.
ALPHA_THRESHOLD = 32


def trim_and_pad(
    img: Image.Image,
    margin_ratio: float = MARGIN_RATIO,
    alpha_threshold: int = ALPHA_THRESHOLD,
) -> Image.Image:
    """Crop to the alpha bounding box and re-pad to a square with small margin."""
    img = img.convert("RGBA")
    alpha = img.split()[-1]
    mask = alpha.point(lambda v: 255 if v > alpha_threshold else 0)
    bbox = mask.getbbox()
    if bbox is None:
        return img
    cropped = img.crop(bbox)

    side = max(cropped.size)
    margin = int(round(side * margin_ratio))
    canvas_side = side + margin * 2

    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    offset = ((canvas_side - cropped.width) // 2, (canvas_side - cropped.height) // 2)
    canvas.paste(cropped, offset, cropped)
    return canvas


def export_png(base: Image.Image, size: int, path: Path) -> None:
    resized = base.resize((size, size), Image.LANCZOS)
    resized.save(path, format="PNG", optimize=True)
    print(f"  wrote {path.relative_to(ROOT)} ({size}x{size})")


def export_ico(base: Image.Image, path: Path) -> None:
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    base.save(path, format="ICO", sizes=sizes)
    print(f"  wrote {path.relative_to(ROOT)} (multi-res)")


def main() -> None:
    print(f"Source: {SRC.relative_to(ROOT)}")
    src = Image.open(SRC)
    base = trim_and_pad(src)
    print(f"Trimmed canvas: {base.size}")

    export_png(base, 16, FAV_DIR / "favicon-16x16.png")
    export_png(base, 32, FAV_DIR / "favicon-32x32.png")
    export_png(base, 180, FAV_DIR / "apple-touch-icon.png")
    export_png(base, 192, FAV_DIR / "android-chrome-192x192.png")
    export_png(base, 512, FAV_DIR / "android-chrome-512x512.png")
    export_ico(base, FAV_DIR / "favicon.ico")
    print("Done.")


if __name__ == "__main__":
    main()
