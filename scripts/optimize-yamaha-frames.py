"""Validate and create responsive WebP hero sequences from yamahahero.zip."""

from __future__ import annotations

import argparse
import collections
import zipfile
from pathlib import Path, PurePosixPath

from PIL import Image, features


FRAME_COUNT = 150
SOURCE_SIZE = (1920, 1080)
MOBILE_SIZE = (960, 540)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    if not features.check("webp"):
        raise SystemExit("This Pillow build does not support WebP encoding.")

    desktop_dir = args.output / "desktop"
    mobile_dir = args.output / "mobile"
    desktop_dir.mkdir(parents=True, exist_ok=True)
    mobile_dir.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(args.archive) as archive:
        entries = [entry for entry in archive.infolist() if not entry.is_dir()]
        png_entries = [entry for entry in entries if entry.filename.lower().endswith(".png")]
        by_name: dict[str, zipfile.ZipInfo] = {}
        for entry in png_entries:
            basename = PurePosixPath(entry.filename.replace("\\", "/")).name
            if basename in by_name:
                raise SystemExit(f"Duplicate frame basename: {basename}")
            by_name[basename] = entry

        expected = {f"ezgif-frame-{index:03}.png" for index in range(1, FRAME_COUNT + 1)}
        if len(entries) != FRAME_COUNT or set(by_name) != expected:
            missing = sorted(expected - set(by_name))
            extra = sorted(set(by_name) - expected)
            raise SystemExit(f"Unexpected archive sequence; missing={missing}, extra={extra}")

        source_modes: collections.Counter[tuple[tuple[int, int], str]] = collections.Counter()
        desktop_bytes = 0
        mobile_bytes = 0
        for index in range(1, FRAME_COUNT + 1):
            name = f"ezgif-frame-{index:03}.png"
            with archive.open(by_name[name]) as stream:
                image = Image.open(stream)
                if image.format != "PNG" or image.size != SOURCE_SIZE or image.mode != "RGB":
                    raise SystemExit(f"Unexpected frame properties in {name}: {image.format}, {image.size}, {image.mode}")
                image.load()
                source_modes[(image.size, image.mode)] += 1

            output_name = f"frame-{index:03}.webp"
            desktop_path = desktop_dir / output_name
            mobile_path = mobile_dir / output_name
            image.save(desktop_path, "WEBP", quality=88, method=5)
            mobile = image.resize(MOBILE_SIZE, Image.Resampling.LANCZOS)
            mobile.save(mobile_path, "WEBP", quality=86, method=5)
            desktop_bytes += desktop_path.stat().st_size
            mobile_bytes += mobile_path.stat().st_size

    print({
        "frames": FRAME_COUNT,
        "source_modes": dict(source_modes),
        "desktop_resolution": SOURCE_SIZE,
        "mobile_resolution": MOBILE_SIZE,
        "desktop_webp_bytes": desktop_bytes,
        "mobile_webp_bytes": mobile_bytes,
        "optimized_total_bytes": desktop_bytes + mobile_bytes,
    })


if __name__ == "__main__":
    main()
