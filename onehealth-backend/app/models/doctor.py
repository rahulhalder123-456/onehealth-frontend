from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    specialty: Mapped[str] = mapped_column(String(150))
    department: Mapped[str | None] = mapped_column(String(100))
    phone: Mapped[str | None] = mapped_column(String(30))
    qualifications: Mapped[str | None] = mapped_column(String(255))
    reg_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    experience: Mapped[str | None] = mapped_column(String(50))
    hospital: Mapped[str | None] = mapped_column(String(255))
    photo_url: Mapped[str | None] = mapped_column(String(500))
    weekly_availability: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    date_availability: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    appointments = relationship("Appointment", back_populates="doctor")
    conversations = relationship("Conversation", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")
