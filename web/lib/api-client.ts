export class ApiClientError extends Error {
  statusCode: number;
  error?: string;
  details?: Record<string, string[]>;

  constructor(message: string, statusCode: number, error?: string, details?: any) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.error = error;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...customConfig } = options;

  let url = endpoint.startsWith("/") ? `/api/proxy${endpoint}` : `/api/proxy/${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const headers = new Headers(customConfig.headers);
  if (!headers.has("Content-Type") && !(customConfig.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const config: RequestInit = {
    ...customConfig,
    headers,
  };

  const response = await fetch(url, config);

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    // 401 Unauthorized handling in browser
    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
    }

    const message =
      data?.message
        ? Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message
        : response.statusText || "Request failed";

    throw new ApiClientError(
      message,
      response.status,
      data?.error,
      data?.details
    );
  }

  // Unwrap backend envelope: { statusCode, message, data } -> data
  if (data && typeof data === "object" && "data" in data) {
    return data.data as T;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
