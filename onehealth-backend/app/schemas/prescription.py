from datetime import datetime

from app.schemas.base import APIModel


class PrescriptionResponse(APIModel):
    id: int
    appointment_id: int | None
    patient_id: int
    patient_name: str
    doctor_id: int | None
    doctor_name: str | None
    uploaded_by: str
    image_url: str
    notes: str | None
    created_at: datetime


class PrescriptionNoteUpdate(APIModel):
    notes: str | None = None
