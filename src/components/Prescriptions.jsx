import { useCallback, useEffect, useMemo, useState } from 'react';
import { prescriptionsApi } from '../services/api';

function formatDate(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function uniquePatients(appointments) {
  const patients = new Map();
  appointments.forEach((appointment) => {
    if (!patients.has(appointment.patientId)) {
      patients.set(appointment.patientId, {
        id: appointment.patientId,
        name: appointment.patientName,
        age: appointment.age,
        gender: appointment.gender,
        service: appointment.category,
      });
    }
  });
  return [...patients.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function Prescriptions({ appointmentsData, showNotification }) {
  const patients = useMemo(() => uniquePatients(appointmentsData), [appointmentsData]);
  const appointmentsByPatient = useMemo(() => {
    const grouped = new Map();
    appointmentsData.forEach((appointment) => {
      grouped.set(appointment.patientId, [...(grouped.get(appointment.patientId) || []), appointment]);
    });
    return grouped;
  }, [appointmentsData]);

  const [selectedPatient, setSelectedPatient] = useState('all');
  const [prescriptions, setPrescriptions] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    patientId: '',
    appointmentId: '',
    notes: '',
    file: null,
  });

  const loadPrescriptions = useCallback(async () => {
    if (patients.length === 0) {
      setPrescriptions([]);
      return;
    }
    setLoading(true);
    try {
      const lists = await Promise.all(patients.map((patient) => prescriptionsApi.listForPatient(patient.id)));
      setPrescriptions(lists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      showNotification({ title: 'Prescriptions unavailable', message: error.message });
    } finally {
      setLoading(false);
    }
  }, [patients, showNotification]);

  useEffect(() => {
    Promise.resolve().then(loadPrescriptions);
  }, [loadPrescriptions]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    async function loadImages() {
      const entries = await Promise.all(
        prescriptions.map(async (prescription) => {
          try {
            const blob = await prescriptionsApi.getImageBlob(prescription.id);
            const url = URL.createObjectURL(blob);
            objectUrls.push(url);
            return [prescription.id, url];
          } catch {
            return [prescription.id, null];
          }
        })
      );
      if (!cancelled) setImageUrls(Object.fromEntries(entries));
    }

    if (prescriptions.length > 0) {
      Promise.resolve().then(loadImages);
    } else {
      Promise.resolve().then(() => {
        if (!cancelled) setImageUrls({});
      });
    }

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [prescriptions]);

  const filtered = selectedPatient === 'all'
    ? prescriptions
    : prescriptions.filter((item) => item.patientId === Number(selectedPatient));
  const incoming = filtered.filter((item) => item.uploadedBy === 'patient');
  const outgoing = filtered.filter((item) => item.uploadedBy === 'doctor');
  const patientAppointments = appointmentsByPatient.get(Number(uploadForm.patientId)) || [];

  const handleFile = (file) => {
    if (!file) return;
    setUploadForm((current) => ({ ...current, file }));
  };

  const submitUpload = async (event) => {
    event.preventDefault();
    if (!uploadForm.patientId || !uploadForm.file) {
      showNotification({ title: 'Upload incomplete', message: 'Select a patient and prescription image.' });
      return;
    }

    const formData = new FormData();
    formData.append('patient_id', uploadForm.patientId);
    if (uploadForm.appointmentId) formData.append('appointment_id', uploadForm.appointmentId);
    if (uploadForm.notes.trim()) formData.append('notes', uploadForm.notes.trim());
    formData.append('image', uploadForm.file);

    try {
      await prescriptionsApi.upload(formData);
      setUploadOpen(false);
      setUploadForm({ patientId: '', appointmentId: '', notes: '', file: null });
      showNotification({ title: 'Prescription sent', message: 'The prescription image is stored for this patient.' });
      await loadPrescriptions();
    } catch (error) {
      showNotification({ title: 'Upload failed', message: error.message });
    }
  };

  const deletePrescription = async (prescription) => {
    try {
      await prescriptionsApi.delete(prescription.id);
      showNotification({ title: 'Prescription deleted', message: 'The file and record were removed.' });
      await loadPrescriptions();
    } catch (error) {
      showNotification({ title: 'Delete failed', message: error.message });
    }
  };

  const renderCard = (prescription, allowDelete = false) => {
    const appointment = appointmentsData.find((item) => item.id === prescription.appointmentId);
    return (
      <article className="prescription-card" key={prescription.id}>
        <button className="prescription-thumb" onClick={() => setLightbox(prescription)}>
          {imageUrls[prescription.id]
            ? <img src={imageUrls[prescription.id]} alt={`${prescription.patientName} prescription`} />
            : <span>Preview unavailable</span>}
        </button>
        <div className="prescription-card-body">
          <div className="prescription-card-top">
            <div>
              <div className="prescription-patient">{prescription.patientName}</div>
              <div className="prescription-meta">
                {appointment ? `Appointment ${formatDate(`${appointment.date}T00:00:00`)}` : 'Standalone upload'}
              </div>
            </div>
            <span className={`prescription-badge ${prescription.uploadedBy}`}>
              {prescription.uploadedBy === 'patient' ? 'Patient Upload' : 'Doctor Upload'}
            </span>
          </div>
          {prescription.notes && <p className="prescription-notes">{prescription.notes}</p>}
          <div className="prescription-actions">
            <span>Uploaded {formatDate(prescription.createdAt)}</span>
            {allowDelete && <button onClick={() => deletePrescription(prescription)}>Delete</button>}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="fade-in prescriptions-page">
      <div className="prescription-toolbar">
        <div className="records-filter-bar">
          <select className="form-input prescription-select" value={selectedPatient}
            onChange={(event) => setSelectedPatient(event.target.value)}>
            <option value="all">All patients</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
          </select>
          <button className="btn-send prescription-send-btn" onClick={() => setUploadOpen(true)}>
            Send Prescription
          </button>
        </div>
      </div>

      <div className="prescription-panels">
        <section className="card-container">
          <div className="card-header">
            <span className="card-title">Incoming Patient Uploads</span>
            <span className="prescription-count">{incoming.length}</span>
          </div>
          <div className="card-body prescription-list">
            {loading ? <div className="empty-state">Loading prescriptions...</div> :
              incoming.length === 0 ? <div className="empty-state">No patient-uploaded prescriptions yet.</div> :
                incoming.map((item) => renderCard(item))}
          </div>
        </section>

        <section className="card-container">
          <div className="card-header">
            <span className="card-title">Outgoing Doctor Uploads</span>
            <span className="prescription-count">{outgoing.length}</span>
          </div>
          <div className="card-body prescription-list">
            {loading ? <div className="empty-state">Loading prescriptions...</div> :
              outgoing.length === 0 ? <div className="empty-state">No prescriptions sent yet.</div> :
                outgoing.map((item) => renderCard(item, true))}
          </div>
        </section>
      </div>

      {uploadOpen && (
        <div className="prescription-lightbox">
          <form className="prescription-modal" onSubmit={submitUpload}>
            <div className="prescription-modal-header">
              <span>Send Prescription</span>
              <button type="button" onClick={() => setUploadOpen(false)}>Close</button>
            </div>
            <div className="form-group">
              <label className="form-label">Patient</label>
              <select className="form-input" value={uploadForm.patientId}
                onChange={(event) => setUploadForm((current) => ({
                  ...current,
                  patientId: event.target.value,
                  appointmentId: '',
                }))}>
                <option value="">Select patient</option>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Appointment</label>
              <select className="form-input" value={uploadForm.appointmentId}
                onChange={(event) => setUploadForm((current) => ({ ...current, appointmentId: event.target.value }))}>
                <option value="">Standalone prescription</option>
                {patientAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {formatDate(`${appointment.date}T00:00:00`)} at {appointment.time} - {appointment.reason}
                  </option>
                ))}
              </select>
            </div>
            <label className={`prescription-dropzone ${dragging ? 'dragging' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFile(event.dataTransfer.files[0]);
              }}>
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleFile(event.target.files[0])} />
              <span>{uploadForm.file ? uploadForm.file.name : 'Drop a JPEG, PNG, or WebP prescription image here'}</span>
            </label>
            <div className="form-group">
              <label className="form-label">Notes / Instructions</label>
              <textarea className="chat-textarea prescription-textarea" value={uploadForm.notes}
                onChange={(event) => setUploadForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Dosage instructions or context..." />
            </div>
            <button className="btn-primary" type="submit">Upload Prescription</button>
          </form>
        </div>
      )}

      {lightbox && (
        <div className="prescription-lightbox" onClick={() => setLightbox(null)}>
          <div className="prescription-image-viewer" onClick={(event) => event.stopPropagation()}>
            <button className="prescription-lightbox-close" onClick={() => setLightbox(null)}>Close</button>
            {imageUrls[lightbox.id] && <img src={imageUrls[lightbox.id]} alt={`${lightbox.patientName} prescription full size`} />}
            <div className="prescription-lightbox-caption">
              <strong>{lightbox.patientName}</strong>
              <span>{lightbox.notes || 'No notes added'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
