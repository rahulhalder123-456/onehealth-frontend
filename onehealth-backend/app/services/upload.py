from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from app.config import settings


ALLOWED_PRESCRIPTION_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def prescription_upload_dir() -> Path:
    path = settings.upload_dir / "prescriptions"
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_prescription_image(file: UploadFile) -> str:
    suffix = ALLOWED_PRESCRIPTION_IMAGE_TYPES.get(file.content_type or "")
    if suffix is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, or WebP prescription images are accepted",
        )

    destination = prescription_upload_dir() / f"{uuid4().hex}{suffix}"
    with destination.open("wb") as output:
        while chunk := file.file.read(1024 * 1024):
            output.write(chunk)
    return f"/uploads/prescriptions/{destination.name}"


def delete_prescription_file(image_url: str) -> None:
    filename = Path(image_url).name
    if not filename:
        return
    path = prescription_upload_dir() / filename
    if path.exists() and path.is_file():
        path.unlink()
