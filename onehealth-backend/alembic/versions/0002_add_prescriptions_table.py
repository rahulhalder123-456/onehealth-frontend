"""Add prescriptions table."""

from alembic import op
import sqlalchemy as sa


revision = "0002_add_prescriptions_table"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "prescriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("appointment_id", sa.Integer(), sa.ForeignKey("appointments.id")),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("doctor_id", sa.Integer(), sa.ForeignKey("doctors.id")),
        sa.Column("uploaded_by", sa.String(10), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("notes", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    for column in ("appointment_id", "patient_id", "doctor_id", "uploaded_by", "created_at"):
        op.create_index(f"ix_prescriptions_{column}", "prescriptions", [column])


def downgrade() -> None:
    op.drop_table("prescriptions")
