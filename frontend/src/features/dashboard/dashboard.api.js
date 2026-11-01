import { apiRequest } from "../../lib/api";

// GET /api/v1/dashboard
// Fetch the authenticated user's dashboard summary.
export async function getDashboard() {
  return apiRequest("/dashboard", {
    method: "GET",
  });
}