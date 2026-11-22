from pathlib import Path
from PIL import Image


SOURCE_DIR = Path(__file__).resolve().parents[1] / "public" / "imgs"


def optimize(source_name: str) -> None:
    source = SOURCE_DIR / source_name
    if not source.exists():
        raise FileNotFoundError(source)

    with Image.open(source) as image:
        image = image.convert("RGB")
        for width in (840, 1672):
            height = round(image.height * width / image.width)
            derivative = image.resize((width, height), Image.Resampling.LANCZOS)
            stem = source.stem
            derivative.save(SOURCE_DIR / f"{stem}-{width}.webp", "WEBP", quality=82, method=6)
            derivative.save(SOURCE_DIR / f"{stem}-{width}.avif", "AVIF", quality=55, speed=6)


for hero_name in ("f1.png", "f2.png", "f3.png", "f4.png"):
    optimize(hero_name)
