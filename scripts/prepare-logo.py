"""Rebuild logo assets: python scripts/prepare-logo.py (requires Pillow)."""
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts" / "assets" / "logo-source.jpg"
PUBLIC = ROOT / "public"


def extract_portrait(image):
    """Remove the border-connected black backdrop and detached bottom emblem."""
    red, green, blue = image.split()
    brightness = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    # Ignore JPEG noise in the black backdrop without changing portrait colors.
    mask = brightness.point(lambda value: 0 if value <= 40 else 255)
    width, height = image.size
    for seed in ((0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1)):
        ImageDraw.floodfill(mask, seed, 128)
    # Fill enclosed details before selecting the portrait at the image center.
    mask = mask.point(lambda value: 0 if value == 128 else 255)
    ImageDraw.floodfill(mask, (width // 2, height // 2), 128)
    mask = mask.point(lambda value: 255 if value == 128 else 0)
    bounds = mask.getbbox()
    if bounds is None:
        raise ValueError("No portrait found in the logo source")

    portrait = image.convert("RGBA")
    portrait.putalpha(mask)
    portrait = portrait.crop(bounds)
    # Keep a small, even transparent margin so the head is never clipped.
    side = round(max(portrait.size) * 1.06)
    canvas = Image.new("RGBA", (side, side))
    canvas.alpha_composite(
        portrait, ((side - portrait.width) // 2, (side - portrait.height) // 2)
    )
    return canvas


def main():
    with Image.open(SOURCE) as source:
        image = extract_portrait(source.convert("RGB"))
    images = PUBLIC / "images"
    images.mkdir(parents=True, exist_ok=True)
    image.save(images / "logo.png", optimize=True)
    image.resize((256, 256), Image.Resampling.LANCZOS).save(
        images / "logo.webp", lossless=True, method=6
    )
    image.resize((48, 48), Image.Resampling.LANCZOS).save(
        PUBLIC / "favicon.png", optimize=True
    )
    image.resize((180, 180), Image.Resampling.LANCZOS).save(
        PUBLIC / "apple-touch-icon.png", optimize=True
    )
    image.save(
        PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
    )


if __name__ == "__main__":
    main()
