export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const TOKEN_KEY = 'onehealth_access_token';
const REFRESH_KEY = 'onehealth_refresh_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_KEY, token);

function apiErrorMessage(payload, fallback) {
  if (typeof payload?.detail === 'string') return payload.detail;
  if (Array.isArray(payload?.detail)) {
    return payload.detail
      .map((item) => item?.msg || item?.message || String(item))
      .join(', ');
  }
  if (payload?.detail && typeof payload.detail === 'object') {
    return payload.detail.message || JSON.stringify(payload.detail);
  }
  return fallback;
}

let isRefreshing = false;
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearToken();
    throw new Error('Refresh token expired — please log in again');
  }

  const data = await response.json();
  setToken(data.accessToken);
  return data.accessToken;
}

async function getValidToken() {
  // If another call is already refreshing, wait for it
  if (isRefreshing) return refreshPromise;

  return getToken();
}

export async function apiRequest(path, options = {}, _isRetry = false) {
  const headers = new Headers(options.headers || {});
  const token = await getValidToken();

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // On 401 — try to refresh the token once
  if (response.status === 401 && !_isRetry && getRefreshToken()) {
    try {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken();
      }
      await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
      // Retry the original request with the new token
      return apiRequest(path, options, true);
    } catch {
      isRefreshing = false;
      refreshPromise = null;
      clearToken();
      window.location.reload();
      throw new Error('Session expired — please log in again');
    }
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(apiErrorMessage(payload, 'Unable to connect to OneHealth'));
  }
  return response.status === 204 ? null : response.json();
}

async function apiBlobRequest(path) {
  const headers = new Headers();
  const token = await getValidToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(apiErrorMessage(payload, 'Unable to load prescription image'));
  }
  return response.blob();
}

export const authApi = {
  sendOtp: (email) => apiRequest('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  verifyOtp: async (email, code) => {
    const data = await apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    // Store both tokens
    setToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data;
  },
  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Best-effort revocation — clear tokens regardless
      }
    }
    clearToken();
  },
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
  uploadFile: (file) => {
    const body = new FormData();
    body.append('file', file);
    return apiRequest('/upload', { method: 'POST', body });
  },
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
