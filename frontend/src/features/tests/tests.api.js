
import { apiRequest } from "../../lib/api";

// Create a new test result.
export async function createTestResult(payload) {
  return apiRequest("/tests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Fetch test results with optional filters and pagination.
export async function getTestResults(params = {}) {
  const query = new URLSearchParams();

  const allowedParams = [
    "from",
    "to",
    "examType",
    "page",
    "limit",
  ];

  for (const key of allowedParams) {
    const value = params[key];

    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();

  return apiRequest(
    queryString ? `/tests?${queryString}` : "/tests"
  );
}

// Fetch one test result by ID.
export async function getTestResult(testId) {
  return apiRequest(`/tests/${encodeURIComponent(testId)}`);
}

// Update an existing test result.
export async function updateTestResult(testId, payload) {
  return apiRequest(`/tests/${encodeURIComponent(testId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// Delete a test result.
export async function deleteTestResult(testId) {
  return apiRequest(`/tests/${encodeURIComponent(testId)}`, {
    method: "DELETE",
  });
}

// Link an existing study session to a test result (P1).
export async function linkTestResultSession(testId, sessionId) {
  return apiRequest(
    `/tests/${encodeURIComponent(testId)}/link-session`,
    {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    }
  );
}
