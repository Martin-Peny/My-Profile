"""Extract the supplied About Me portrait without repainting its RGB pixels.

Run in an isolated environment with rembg[cpu] and opencv-python-headless.
The U2NET_HOME
environment variable can point to an existing directory containing u2net.onnx.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps
from pymatting import estimate_alpha_cf
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "photo" / "微信图片_2026-10-17_231547_909.jpg"
OUTPUT = ROOT / "public" / "images"
QA = ROOT / "artifacts"


def main():
    source = ImageOps.exif_transpose(Image.open(SOURCE)).convert("RGB")
    assert source.size == (1080, 1440), "Foreground constraints require the original source frame."
    source.info.clear()
    cv2.setRNGSeed(0)
    QA.mkdir(exist_ok=True)
    cached_mask = QA / "about-u2net-mask.png"
    if cached_mask.exists() and cached_mask.stat().st_mtime >= SOURCE.stat().st_mtime:
        mask = Image.open(cached_mask).convert("L")
    else:
        session = new_session("u2net", providers=["CPUExecutionProvider"])
        mask = remove(source, session=session, only_mask=True).convert("L")
        mask.save(cached_mask)
    # U2-Net recognizes the face but misses the dark hair and shirt in this
    # close-up. Constrain foreground/background with source-specific scribbles,
    # then use GrabCut and closed-form edge matting to retain the whole person.
    rgb = np.asarray(source)
    labels = np.full(rgb.shape[:2], cv2.GC_PR_FGD, dtype=np.uint8)
    labels[np.asarray(mask) > 240] = cv2.GC_FGD
    background_regions = [
        [(0, 0), (105, 0), (50, 40), (0, 100)],
        [(970, 0), (1079, 0), (1079, 128), (1035, 80)],
        [(0, 520), (12, 542), (39, 600), (42, 646), (0, 651)],
        [(1079, 520), (1079, 700), (1022, 698), (1050, 625)],
        [(145, 1439), (173, 1350), (181, 1340), (215, 1439)],
    ]
    for polygon in background_regions:
        cv2.fillPoly(labels, [np.array(polygon, dtype=np.int32)], cv2.GC_BGD)
    # Interior strokes explicitly include the entire hairstyle and clothing.
    cv2.ellipse(labels, (540, 290), (390, 270), 0, 0, 360, cv2.GC_FGD, -1)
    cv2.rectangle(labels, (220, 0), (850, 350), cv2.GC_FGD, -1)
    cv2.rectangle(labels, (20, 860), (1060, 1250), cv2.GC_FGD, -1)
    cv2.rectangle(labels, (270, 1200), (1079, 1439), cv2.GC_FGD, -1)
    cv2.rectangle(labels, (0, 1250), (50, 1439), cv2.GC_FGD, -1)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), labels, None,
                np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64),
                5, cv2.GC_INIT_WITH_MASK)
    foreground = np.isin(labels, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
    # A narrow unknown band softens genuine hair edges without altering RGB.
    kernel = np.ones((21, 21), np.uint8)
    inside = cv2.erode(foreground, kernel)
    outside = cv2.erode(1 - foreground, kernel)
    trimap = np.full(foreground.shape, 0.5, dtype=np.float64)
    trimap[inside == 1] = 1
    trimap[outside == 1] = 0
    alpha = estimate_alpha_cf(rgb.astype(np.float64) / 255, trimap)
    alpha = (np.clip((alpha - 0.03) / 0.94, 0, 1) * 255).round().astype(np.uint8)
    portrait = source.convert("RGBA")
    portrait.putalpha(Image.fromarray(alpha))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    portrait.save(OUTPUT / "about-portrait.png", optimize=True)
    portrait.save(OUTPUT / "about-portrait.webp", quality=92, method=6, exact=True)

    previews = Image.new("RGB", (source.width * 3, source.height))
    previews.paste(source, (0, 0))
    for index, background in enumerate(("#080808", "#252525"), start=1):
        composite = Image.new("RGBA", portrait.size, background)
        composite.alpha_composite(portrait)
        previews.paste(composite.convert("RGB"), (index * source.width, 0))
    previews.resize((1350, 600)).save(QA / "about-portrait-cutout-qa.jpg", quality=94)
    # A full-resolution PNG must retain the source pixels exactly.
    assert np.array_equal(np.asarray(Image.open(OUTPUT / "about-portrait.png"))[:, :, :3], rgb)
    assert alpha.min() == 0 and alpha.max() == 255
    # Regression checks for the hair, both shoulders, and lower torso.
    for x, y in [(540, 100), (200, 400), (80, 1000), (1000, 900), (600, 1380)]:
        assert alpha[y, x] == 255, f"Missing person pixel at {(x, y)}"
    for x, y in [(10, 10), (1050, 10), (20, 600), (1050, 660), (180, 1380)]:
        assert alpha[y, x] == 0, f"Background remains at {(x, y)}"
    print(f"Prepared {portrait.width} x {portrait.height} transparent About Me portrait.")


if __name__ == "__main__":
    main()
