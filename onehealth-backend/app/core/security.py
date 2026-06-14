import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from jwt import InvalidTokenError

from app.config import settings


def hash_otp(code: str) -> str:
    return hashlib.sha256(f"{settings.jwt_secret}:{code}".encode()).hexdigest()


def create_access_token(doctor_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(doctor_id),
        "role": "doctor",
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token_payload(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def decode_access_token(token: str) -> int:
    payload = decode_token_payload(token)
    return int(payload["sub"])


__all__ = ["InvalidTokenError", "create_access_token", "decode_access_token", "decode_token_payload", "hash_otp"]
