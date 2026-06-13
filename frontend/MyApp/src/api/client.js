// src/api/client.js
// One request wrapper for the pattern previously copy-pasted into every screen:
//   fetch -> res.text() -> safe JSON.parse -> check res.ok / data.success.
// IMPORTANT: URLs, methods, bodies and headers are IDENTICAL to the originals.
// The backend is frozen; this only centralizes the client side.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY } from '../../config';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request(path, { method = 'GET', body, headers = {}, auth = false, token } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const finalHeaders = { Accept: 'application/json', ...headers };
  const hasBody = body !== undefined && body !== null;
  if (hasBody && !(body instanceof FormData)) finalHeaders['Content-Type'] = 'application/json';

  if (auth || token) {
    const t = token || (await AsyncStorage.getItem(TOKEN_KEY));
    if (t) finalHeaders.Authorization = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: hasBody ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (e) {
    throw new ApiError('Network error. Please check your connection and try again.', 0, null);
  }

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    throw new ApiError(`Unexpected server response (HTTP ${res.status})`, res.status, raw);
  }

  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.message || `Request failed (HTTP ${res.status})`, res.status, data);
  }
  return data;
}

export const api = {
  get: (p, o) => request(p, { ...o, method: 'GET' }),
  post: (p, body, o) => request(p, { ...o, method: 'POST', body }),
  put: (p, body, o) => request(p, { ...o, method: 'PUT', body }),
  patch: (p, body, o) => request(p, { ...o, method: 'PATCH', body }),
  del: (p, body, o) => request(p, { ...o, method: 'DELETE', body }),
};
