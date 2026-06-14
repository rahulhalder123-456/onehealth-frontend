from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import exists, select
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.core.deps import CurrentUser, get_current_user
from app.database import get_db
from app.models import Appointment, Prescription
from app.schemas.prescription import PrescriptionNoteUpdate, PrescriptionResponse
from app.services.upload import delete_prescription_file, save_prescription_image


router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


def doctor_has_patient(db: Session, doctor_id: int, patient_id: int) -> bool:
    return db.scalar(
        select(
            exists().where(
                Appointment.doctor_id == doctor_id,
                Appointment.patient_id == patient_id,
            )
        )
    )


def validate_appointment(db: Session, appointment_id: int, doctor_id: int | None, patient_id: int) -> Appointment:
    filters = [Appointment.id == appointment_id, Appointment.patient_id == patient_id]
    if doctor_id is not None:
        filters.append(Appointment.doctor_id == doctor_id)
    appointment = db.scalar(select(Appointment).where(*filters))
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Appointment is not accessible")
    return appointment


def serialize(prescription: Prescription) -> PrescriptionResponse:
    return PrescriptionResponse(
        id=prescription.id,
        appointment_id=prescription.appointment_id,
        patient_id=prescription.patient_id,
        patient_name=prescription.patient.name,
        doctor_id=prescription.doctor_id,
        doctor_name=prescription.doctor.name if prescription.doctor else None,
        uploaded_by=prescription.uploaded_by,
        image_url=prescription.image_url,
        notes=prescription.notes,
        created_at=prescription.created_at,
    )


def prescription_query():
    return select(Prescription).options(
        joinedload(Prescription.patient),
        joinedload(Prescription.doctor),
        joinedload(Prescription.appointment),
    )


def get_accessible_prescription(db: Session, prescription_id: int, user: CurrentUser) -> Prescription:
    prescription = db.scalar(prescription_query().where(Prescription.id == prescription_id))
    if prescription is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")

    if user.role == "patient" and prescription.patient_id == user.id:
        return prescription
    if user.role == "doctor" and doctor_has_patient(db, user.id, prescription.patient_id):
        return prescription
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Prescription is not accessible")


@router.post("/upload", response_model=PrescriptionResponse)
def upload_prescription(
    image: UploadFile = File(...),
    patient_id: int | None = Form(None),
    appointment_id: int | None = Form(None),
    notes: str | None = Form(None),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PrescriptionResponse:
    if user.role == "patient":
        resolved_patient_id = user.id
        resolved_doctor_id = None
        if appointment_id is not None:
            validate_appointment(db, appointment_id, None, resolved_patient_id)
    elif user.role == "doctor":
        if patient_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="patient_id is required for doctor uploads")
        if not doctor_has_patient(db, user.id, patient_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient is not linked to this doctor")
        resolved_patient_id = patient_id
        resolved_doctor_id = user.id
        if appointment_id is not None:
            validate_appointment(db, appointment_id, user.id, resolved_patient_id)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unsupported uploader")

    image_url = save_prescription_image(image)
    prescription = Prescription(
        appointment_id=appointment_id,
        patient_id=resolved_patient_id,
        doctor_id=resolved_doctor_id,
        uploaded_by=user.role,
        image_url=image_url,
        notes=notes,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return serialize(db.scalar(prescription_query().where(Prescription.id == prescription.id)))


@router.get("/mine", response_model=list[PrescriptionResponse])
def list_my_prescriptions(
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PrescriptionResponse]:
    if user.role != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access required")
    prescriptions = db.scalars(
        prescription_query()
        .where(Prescription.patient_id == user.id)
        .order_by(Prescription.created_at.desc())
    ).all()
    return [serialize(item) for item in prescriptions]


@router.get("/patients/{patient_id}", response_model=list[PrescriptionResponse])
def list_for_patient(
    patient_id: int,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PrescriptionResponse]:
    if user.role != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    if not doctor_has_patient(db, user.id, patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient is not linked to this doctor")

    prescriptions = db.scalars(
        prescription_query()
        .where(Prescription.patient_id == patient_id)
        .order_by(Prescription.created_at.desc())
    ).all()
    return [serialize(item) for item in prescriptions]


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_prescription(
    prescription_id: int,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PrescriptionResponse:
    return serialize(get_accessible_prescription(db, prescription_id, user))


@router.get("/{prescription_id}/image")
def get_prescription_image(
    prescription_id: int,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    prescription = get_accessible_prescription(db, prescription_id, user)
    file_path = settings.upload_dir / "prescriptions" / Path(prescription.image_url).name
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription image not found")
    return FileResponse(file_path)


@router.patch("/{prescription_id}", response_model=PrescriptionResponse)
def update_prescription_notes(
    prescription_id: int,
    payload: PrescriptionNoteUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PrescriptionResponse:
    prescription = get_accessible_prescription(db, prescription_id, user)
    if prescription.uploaded_by != user.role or (user.role == "doctor" and prescription.doctor_id != user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the uploader can update notes")
    prescription.notes = payload.notes
    db.commit()
    db.refresh(prescription)
    return serialize(prescription)


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prescription(
    prescription_id: int,
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    prescription = get_accessible_prescription(db, prescription_id, user)
    owns_doctor_upload = user.role == "doctor" and prescription.uploaded_by == "doctor" and prescription.doctor_id == user.id
    owns_patient_upload = user.role == "patient" and prescription.uploaded_by == "patient" and prescription.patient_id == user.id
    if not (owns_doctor_upload or owns_patient_upload):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the uploader can delete this prescription")

    delete_prescription_file(prescription.image_url)
    db.delete(prescription)
    db.commit()
