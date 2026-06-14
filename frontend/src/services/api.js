export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const TOKEN_KEY = 'onehealth_access_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || 'Unable to connect to OneHealth');
  }
  return response.status === 204 ? null : response.json();
}

async function apiBlobRequest(path) {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.detail || 'Unable to load prescription image');
  }
  return response.blob();
}

export const authApi = {
  sendOtp: (email) => apiRequest('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyOtp: (email, code) => apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  }),
};

export const doctorApi = {
  profile: () => apiRequest('/doctors/me'),
  availability: () => apiRequest('/doctors/me/availability'),
  saveWeeklyAvailability: (schedule) => apiRequest('/doctors/me/availability', {
    method: 'PUT',
    body: JSON.stringify({ schedule }),
  }),
  saveDateAvailability: (availability) => apiRequest('/doctors/me/date-availability', {
    method: 'PUT',
    body: JSON.stringify({ availability }),
  }),
  uploadPhoto: (photo) => {
    const body = new FormData();
    body.append('photo', photo);
    return apiRequest('/doctors/me/photo', { method: 'POST', body });
  },
};

export const appointmentsApi = {
  list: () => apiRequest('/appointments/').then((items) =>
    items.map((item) => ({ ...item, time: item.time.slice(0, 5) }))),
};

export const chatApi = {
  conversations: () => apiRequest('/chat/conversations'),
  messages: (id) => apiRequest(`/chat/conversations/${id}/messages`),
  sendMessage: (id, content) => apiRequest(`/chat/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
  websocketUrl: (id) => {
    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    return `${wsBase}/chat/ws/${id}?token=${encodeURIComponent(getToken())}`;
  },
};

export const prescriptionsApi = {
  upload: (formData) => apiRequest('/prescriptions/upload', {
    method: 'POST',
    body: formData,
  }),
  listForPatient: (patientId) => apiRequest(`/prescriptions/patients/${patientId}`),
  get: (prescriptionId) => apiRequest(`/prescriptions/${prescriptionId}`),
  getImageBlob: (prescriptionId) => apiBlobRequest(`/prescriptions/${prescriptionId}/image`),
  delete: (prescriptionId) => apiRequest(`/prescriptions/${prescriptionId}`, { method: 'DELETE' }),
};
