from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, decode_token_payload
from app.database import get_db
from app.models import Doctor, Patient


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    role: str
    id: int
    entity: Doctor | Patient


def get_current_doctor(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Doctor:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        doctor_id = decode_access_token(credentials.credentials)
    except (InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token") from None

    doctor = db.get(Doctor, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor account not found")
    return doctor


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = decode_token_payload(credentials.credentials)
        user_id = int(payload["sub"])
        role = payload.get("role", "doctor")
    except (InvalidTokenError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token") from None

    if role == "doctor":
        doctor = db.get(Doctor, user_id)
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Doctor account not found")
        return CurrentUser(role="doctor", id=doctor.id, entity=doctor)

    if role == "patient":
        patient = db.get(Patient, user_id)
        if patient is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Patient account not found")
        return CurrentUser(role="patient", id=patient.id, entity=patient)

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unsupported access token role")
