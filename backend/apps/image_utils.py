from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError


def compress_uploaded_image(uploaded_file, max_dimension=1920):
    try:
        with Image.open(uploaded_file) as source:
            image = ImageOps.exif_transpose(source)
            image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            has_transparency = (
                image.mode in ("RGBA", "LA")
                or "transparency" in image.info
            )
            output_format = "WEBP" if has_transparency else "JPEG"
            if output_format == "WEBP":
                image = image.convert("RGBA")
                save_options = {
                    "quality": 82,
                    "optimize": True,
                    "method": 6,
                }
            else:
                image = image.convert("RGB")
                save_options = {
                    "quality": 82,
                    "optimize": True,
                    "progressive": True,
                }

            output = BytesIO()
            image.save(
                output,
                format=output_format,
                **save_options,
            )
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("No se pudo procesar la imagen.") from error
    finally:
        uploaded_file.seek(0)

    extension = ".webp" if output_format == "WEBP" else ".jpg"
    filename = f"{Path(uploaded_file.name).stem}{extension}"
    return ContentFile(output.getvalue(), name=filename)
