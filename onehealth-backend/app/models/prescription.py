from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id"), index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("doctors.id"), index=True)
    uploaded_by: Mapped[str] = mapped_column(String(10), index=True)
    image_url: Mapped[str] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    appointment = relationship("Appointment", back_populates="prescriptions")
    patient = relationship("Patient", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
