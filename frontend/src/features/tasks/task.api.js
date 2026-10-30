
import { apiRequest } from "../../lib/api";

// Allowed filters according to the StudyPulse Task API contract.
const allowedQueryParams = [
  "view",
  "subjectId",
  "status",
  "priority",
  "sort",
  "page",
  "limit",
];

// GET /tasks
// Fetch tasks with optional filters and pagination.
export async function getTasks(params = {}) {
  const queryParams = new URLSearchParams();

  for (const key of allowedQueryParams) {
    const value = params[key];

    if (value !== undefined && value !== null && value !== "") {
      queryParams.set(key, String(value));
    }
  }

  const queryString = queryParams.toString();
  const endpoint = queryString
    ? `/tasks?${queryString}`
    : "/tasks";

  return apiRequest(endpoint);
}

// GET /tasks/:taskId
// Fetch one task by its ID.
export async function getTaskById(taskId) {
  return apiRequest(`/tasks/${encodeURIComponent(taskId)}`);
}

// POST /tasks
// Create a new task.
export async function createTask(taskData) {
  return apiRequest("/tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
  });
}

// PATCH /tasks/:taskId
// Update an existing task.
export async function updateTask(taskId, taskData) {
  return apiRequest(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify(taskData),
  });
}
