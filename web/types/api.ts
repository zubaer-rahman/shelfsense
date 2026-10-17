export interface PaginatedResponse<T> {
  data: T[];
  items?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  details?: Record<string, string[]>;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: "OWNER" | "STAFF";
  };
  expiresIn?: number;
}
