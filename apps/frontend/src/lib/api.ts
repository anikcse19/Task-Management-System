const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Central API client for the frontend.
 * Handles authentication headers, token refresh, and error handling.
 */

// In-memory token storage (not localStorage for security)
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Makes an authenticated API request.
 * Automatically adds JWT token and handles 401 with token refresh.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}/api/v1${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // send cookies (refresh token)
  });

  // If unauthorized, try refreshing the token
  if (response.status === 401 && accessToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with the new token
      headers["Authorization"] = `Bearer ${accessToken}`;
      const retryResponse = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({}));
        throw new ApiError(
          retryResponse.status,
          error.message || "Request failed",
        );
      }
      return retryResponse.json();
    } else {
      // Refresh failed — clear token and redirect to login
      setAccessToken(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError(401, "Session expired");
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.message || "Request failed");
  }

  return response.json();
}

/**
 * Attempts to refresh the access token using the httpOnly refresh cookie.
 * Exported so auth context can call it directly on page refresh.
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Auth API ──────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{
      data: { accessToken: string; user: User };
      message: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiRequest<{ data: null; message: string }>("/auth/logout", {
      method: "POST",
    }),

  me: () => apiRequest<{ data: User }>("/auth/me"),
};

// ─── Tasks API ─────────────────────────────────────────

export const tasksApi = {
  getAll: () => apiRequest<{ data: Task[] }>("/tasks"),

  getMyTasks: () => apiRequest<{ data: Task[] }>("/tasks/my"),

  getOne: (id: string) => apiRequest<{ data: Task }>(`/tasks/${id}`),

  create: (data: {
    title: string;
    description: string;
    assignedToId?: string;
  }) =>
    apiRequest<{ data: Task; message: string }>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; description?: string }) =>
    apiRequest<{ data: Task; message: string }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ data: null; message: string }>(`/tasks/${id}`, {
      method: "DELETE",
    }),

  updateStatus: (id: string, status: string) =>
    apiRequest<{ data: Task; message: string }>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  assign: (id: string, assignedToId: string) =>
    apiRequest<{ data: Task; message: string }>(`/tasks/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignedToId }),
    }),
};

// ─── Users API ─────────────────────────────────────────

export const usersApi = {
  getAll: () => apiRequest<{ data: UserWithCounts[] }>("/users"),

  getOne: (id: string) => apiRequest<{ data: UserWithCounts }>(`/users/${id}`),

  create: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) =>
    apiRequest<{ data: UserWithCounts; message: string }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: { name?: string; email?: string; password?: string; role?: string },
  ) =>
    apiRequest<{ data: UserWithCounts; message: string }>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ data: null; message: string }>(`/users/${id}`, {
      method: "DELETE",
    }),
};

// ─── Audit Logs API ────────────────────────────────────

export const auditApi = {
  getAll: (page: number = 1, limit: number = 20) =>
    apiRequest<AuditLogsResponse>(`/audit-logs?page=${page}&limit=${limit}`),
};

// ─── Types ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

export interface UserWithCounts extends User {
  updatedAt: string;
  _count: {
    assignedTasks: number;
    createdTasks: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "PENDING" | "PROCESSING" | "DONE";
  assignedTo: User | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: "ADMIN" | "USER";
  action: string;
  entityType: string;
  entityId: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  timestamp: string;
  entityTitle: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
