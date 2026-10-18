"""Rebuild the hero textures: python scripts/prepare-portrait.py (requires Pillow).

Depth is an art-directed relief, not a reconstruction of unseen anatomy.
Coordinates below refer to the supplied, unmodified 1536 x 1024 photograph.
"""
from pathlib import Path
import colorsys
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts" / "assets" / "portrait-source.png"
OUTPUT = ROOT / "public" / "images"
CROP = (420, 55, 1050, 1024)
BOTTOM_PADDING = 28

# (center x, center y, radius x, radius y, depth contribution)
VOLUMES = [
    (785, 665, 210, 360, .28),  # torso
    (745, 218, 145, 125, .31),  # hair
    (724, 306, 78, 103, .29),   # face
    (663, 299, 25, 30, .14),    # nose
    (879, 458, 94, 136, .30),   # forward shoulder
    (804, 645, 97, 154, .28),   # sleeve
    (638, 884, 101, 135, .42),  # forearm and hand
    (486, 947, 62, 66, .51),    # microphone
]


def smoothstep(start, end, value):
    amount = max(0, min(1, (value - start) / (end - start)))
    return amount * amount * (3 - 2 * amount)


def remove_hair_halo(image):
    """Remove blue spill and translucent halo pixels around the original hair."""
    pixels = image.load()
    for y in range(min(image.height, 370 - CROP[1])):
        head_mask = 1 - smoothstep(320, 370, y + CROP[1])
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if not a or b <= max(r, g):
                continue
            hue, _, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # Feather the blue selection to avoid a hard color boundary.
            blue_mask = smoothstep(.50, .57, hue) * (1 - smoothstep(.73, .80, hue))
            amount = head_mask * blue_mask
            # Retain the dark hair signal, rather than the brightness of the spill.
            hair = min(r, g)
            rgb = tuple(round(channel + (hair - channel) * amount) for channel in (r, g, b))
            spill = (b - max(r, g)) / max(1, b)
            alpha = round(a * (1 - amount * smoothstep(.15, .8, spill)))
            pixels[x, y] = (*rgb, alpha)


def main():
    image = Image.open(SOURCE).convert("RGBA").crop(CROP)
    rgba = list(image.getdata())
    # The source has stray alpha=1 pixels far beyond the silhouette.
    image.putdata([(r, g, b, 0 if a <= 2 else a) for r, g, b, a in rgba])
    remove_hair_halo(image)
    portrait = Image.new("RGBA", (image.width, image.height + BOTTOM_PADDING))
    portrait.paste(image, (0, 0))
    depth = Image.new("L", portrait.size)
    values = []
    for y in range(portrait.height):
        for x in range(portrait.width):
            sx, sy = x + CROP[0], y + CROP[1]
            value = .24 + sum(
                strength * math.exp(-2 * (((sx - cx) / rx) ** 2 + ((sy - cy) / ry) ** 2))
                for cx, cy, rx, ry, strength in VOLUMES
            )
            values.append(round(min(.95, value) * 255))
    depth.putdata(values)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    portrait.save(OUTPUT / "hero-portrait.webp", quality=92, method=6, exact=True)
    depth.save(OUTPUT / "hero-portrait-depth.png", optimize=True)
    print(f"Prepared {portrait.width} x {portrait.height} portrait and depth map in public/images")


if __name__ == "__main__":
    main()
