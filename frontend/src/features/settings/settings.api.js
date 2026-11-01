
import { apiRequest } from "../../lib/api";

export function updateSettings(payload) {
  return apiRequest("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
