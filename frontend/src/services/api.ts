import type { ClassOffering, CreateClassPayload, Hold, StudentHold, ApiProblemDetails } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  problemDetails?: ApiProblemDetails;

  constructor(status: number, message: string, problemDetails?: ApiProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problemDetails = problemDetails;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, studentId?: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (studentId) {
    headers.set('X-Student-Id', studentId.trim());
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown network failure';
    throw new ApiError(0, `Cannot connect to server at ${API_BASE_URL}. Ensure the backend API is running. (${errorMsg})`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const responseText = await response.text();
  let data: any = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const detail = data?.detail || data?.title || (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    throw new ApiError(response.status, detail, typeof data === 'object' ? data : undefined);
  }

  return data as T;
}

export const api = {
  // 1. Classes
  getClasses: () => request<ClassOffering[]>('/classes'),
  getClassById: (classId: string) => request<ClassOffering>(`/classes/${classId}`),
  createClass: (payload: CreateClassPayload) =>
    request<ClassOffering>('/classes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 2. Holds
  createHold: (classId: string, studentId: string) =>
    request<Hold>(`/classes/${classId}/holds`, {
      method: 'POST',
      body: JSON.stringify({}),
    }, studentId),

  getHold: (holdId: string) => request<Hold>(`/holds/${holdId}`),

  confirmHold: (holdId: string, studentId: string) =>
    request<{ holdId: string; status: string }>(`/holds/${holdId}/confirm`, {
      method: 'POST',
    }, studentId),

  cancelHold: (holdId: string, studentId: string) =>
    request<void>(`/holds/${holdId}`, {
      method: 'DELETE',
    }, studentId),

  // 3. My Holds
  getMyHolds: (studentId: string) =>
    request<StudentHold[]>('/me/holds', {
      method: 'GET',
    }, studentId),
};
