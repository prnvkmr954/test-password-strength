const API_BASE = 'http://localhost:3000';

export type ApiError = {
  error: string;
  details?: Record<string, string[]>;
  hint?: string;
};

export type LoginResponse = {
  message: string;
  user: { username: string; created_at: string };
};

export type UserProfile = {
  username: string;
  created_at: string;
  updated_at: string;
  password_history_count: number;
};

export type RegisterResponse = { message: string };
export type ChangePasswordResponse = { message: string; history_entries: number };
export type HealthResponse = { status: string; timestamp: string };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.error || 'Something went wrong');
  }

  return data as T;
}

export async function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

export async function register(username: string, password: string): Promise<RegisterResponse> {
  return request<RegisterResponse>('/users', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>(`/users/${encodeURIComponent(username)}/password`, {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export async function getUserProfile(username: string): Promise<UserProfile> {
  return request<UserProfile>(`/users/${encodeURIComponent(username)}`);
}
