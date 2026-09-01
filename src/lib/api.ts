// Base API client for the ShopSpace backend.
// Set VITE_API_URL in your .env to your Render backend URL,
// e.g. https://shopspace-backend.onrender.com/api

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
  auth?: boolean; // if true, attaches the stored JWT as a Bearer token
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, headers, ...rest } = options;

  // For FormData bodies (file uploads), let the browser set its own
  // multipart/form-data Content-Type with the correct boundary.
  const isFormData = rest.body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = localStorage.getItem('shopspace_token');
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: formData }),
};
