
import { apiRequest } from "../../lib/api";

export async function createStudySession(payload) {
  return apiRequest("/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStudySessions(params = {}) {
  const query = new URLSearchParams();

  query.set("page", params.page || 1);
  query.set("limit", params.limit || 10);

  const queryString = query.toString();

  return apiRequest(`/sessions?${queryString}`);
}
