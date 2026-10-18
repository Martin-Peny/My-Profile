"""Generate gallery WebP variants and a manifest: python scripts/prepare-gallery.py.

Requires Pillow. Source photographs stay in photo/ and are never modified.
"""

import hashlib
import json
import random
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "photo"
OUTPUT = ROOT / "public" / "images" / "gallery"
MANIFEST = ROOT / "src" / "gallery-images.json"

# Descriptions identify visible details, without inferring names or locations.
DESCRIPTIONS = {
    "2145194bf2120cbb7b61827652d5cba9": "A performer in a red jacket on a blue-lit stage.",
    "242e62472667c0edbf37984d9bee082b": "A group posing together in formal black and white clothing.",
    "37c086499582cedbf4e87cbf7dc0bda9": "A singer holding a microphone beside a keyboard on stage.",
    "7fe71584e17f919af3dc82278ce5b4ca": "A singer in a black jacket holding a microphone.",
    "b18393f63744fcefd6bf237409036a8d": "A seated figure in dark clothing against a pale wall.",
    "ddad9c2a0661a2892a521a2312ec0d5c": "A singer raising one arm beneath colorful stage lights.",
    "231002_050": "A person wearing glasses and a red hooded jacket.",
    "231031_254": "Two people wearing glasses and posing side by side indoors.",
    "231051_131": "A portrait in dark clothing against leafy greenery.",
    "231126_487": "A graduate in a cap and gown holding a plush toy against a blue backdrop.",
    "231207_018": "A person making peace signs behind a small cake.",
    "231215_861": "A person in a red jacket leaning over a bowl of food.",
    "231236_682": "A person in a red jacket seated at a table.",
    "231301_133": "A person standing beside a decorated tree indoors.",
    "231313_726": "Two people holding microphones on a stage.",
    "231323_440": "A performer silhouetted before a projected ocean scene.",
    "231328_878": "A performer on stage beneath large projected lettering.",
    "231334_525": "A singer in dark clothing on a stage with red floor lights.",
    "231341_785": "A group posing on stage in front of a red curtain.",
    "231345_723": "A performer holding a microphone in front of a red curtain.",
    "231349_976": "Two presenters standing together before a red curtain.",
    "231403_655": "A black and white photograph of two people on steps.",
    "231411_179": "A group in coats posing against a light background.",
    "231507_512": "A close portrait with a plush toy resting on the person's head.",
    "231520_968": "A singer in a red jacket against a pink stage backdrop.",
    "231531_813": "A person wearing glasses and a white shirt indoors.",
    "231547_909": "A close portrait of a person wearing dark-rimmed glasses.",
    "231606_158": "A person in a patterned shirt holding a microphone before an orange backdrop.",
    "231643_073": "A singer performing in front of a blue sky projection.",
    "231654_511": "A singer on a red-lit stage in front of an audience.",
    "231735_838": "Two people posing together against a light background.",
    "231809_071": "A performer holding a microphone before a projected backdrop.",
    "231859_472": "A close stage photograph of a singer wearing glasses.",
    "231924_590": "A singer silhouetted against large white projected lettering.",
    "232033_510": "A person in a striped shirt posing against a blue backdrop.",
    "232254_401": "Several performers standing across a brightly lit stage.",
    "232605_882": "A group posing together under green indoor lighting.",
    "232619_645": "A blurred portrait illuminated by deep blue light.",
    "232711_616": "A person in a dark sweatshirt seated on wooden flooring.",
    "232719_243": "A person in dark clothing standing on a dim stairway.",
    "232729_953": "A shadowed portrait against a blue background with lettering.",
    "232759_182": "A person singing beside a music stand in a room.",
    "232834_402": "Two people seated together beside a window.",
    "232901_621": "A large ensemble gathered on a concert stage.",
    "232935_866": "A singer holding a microphone beneath bright stage lights.",
    "232949_832": "A close photograph of a singer beneath blue and purple stage lights.",
    "233005_140": "A group in dark coats posing outdoors beside a building.",
    "233138_390": "Two people taking a mirror photograph together.",
    "233159_721": "A person in a dark jacket holding a yellow bag indoors.",
}


def prepare():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    previous_names = set()
    if MANIFEST.exists():
        previous_names = {Path(variant["src"]).name
                          for entry in json.loads(MANIFEST.read_text(encoding="utf-8"))
                          for variant in entry["variants"]}
    images = []
    excluded = []
    landscape_count = 0
    for path in sorted(SOURCE.glob("*.jpg")):
        with Image.open(path) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            width, height = image.size
            ratio = width / height
            if 1.25 <= ratio <= 1.90:
                row = "top" if landscape_count % 2 == 0 else "bottom"
                landscape_count += 1
            elif 0.60 <= ratio <= 0.80:
                row = "middle"
            else:
                excluded.append(path.name)
                continue

            key = path.stem if len(path.stem) == 32 else path.stem[-10:]
            alt = DESCRIPTIONS[key]  # Fail visibly when a new photograph needs a description.
            image_id = hashlib.sha256(path.name.encode("utf-8")).hexdigest()[:12]
            variants = []
            for target_height in (420, 840):
                scale = min(1, target_height / height)
                size = (round(width * scale), round(height * scale))
                resized = image.resize(size, Image.Resampling.LANCZOS)
                # Recreate pixels so no EXIF, XMP, or other source metadata survives.
                clean = Image.frombytes("RGB", resized.size, resized.tobytes())
                name = f"{image_id}-{size[1]}.webp"
                clean.save(OUTPUT / name, "WEBP", quality=83, method=6)
                variants.append({"src": f"images/gallery/{name}", "width": size[0], "height": size[1]})
            images.append({"id": image_id, "row": row, "width": width, "height": height,
                           "alt": alt, "variants": variants})

    # Persist a mixed portrait sequence; regeneration keeps the same arrangement.
    portraits = [entry for entry in images if entry["row"] == "middle"]
    random.Random(20261018).shuffle(portraits)
    portrait_sequence = iter(portraits)
    images = [next(portrait_sequence) if entry["row"] == "middle" else entry for entry in images]
    MANIFEST.write_text(json.dumps(images, indent=2) + "\n", encoding="utf-8")
    current_names = {Path(variant["src"]).name for entry in images for variant in entry["variants"]}
    for name in previous_names - current_names:
        stale = OUTPUT / name
        if stale.resolve().parent == OUTPUT.resolve() and stale.suffix == ".webp":
            stale.unlink(missing_ok=True)
    print(f"Prepared {len(images)} photos; excluded {len(excluded)} by aspect ratio.")
    for name in excluded:
        print(f"Excluded: {name}")


if __name__ == "__main__":
    prepare()
