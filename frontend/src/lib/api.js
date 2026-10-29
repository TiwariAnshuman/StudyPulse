
import { getAccessToken } from "../features/auth/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(path, options = {}) {
  const token = getAccessToken();

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
      data?.message ||
      "Something went wrong. Please try again."
    );

    error.status = response.status;
    error.code = data?.error?.code;
    error.data = data;

    throw error;
  }

  return data;
}
