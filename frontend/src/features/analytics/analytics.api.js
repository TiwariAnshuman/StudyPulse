
import { apiRequest } from "../../lib/api";

// Build query string for analytics date range.
function buildDateRangeQuery({ from, to }) {
  if (!from || !to) {
    throw new Error("Both start date and end date are required.");
  }

  if (from > to) {
    throw new Error("Start date cannot be after end date.");
  }

  const queryParams = new URLSearchParams({
    from,
    to,
  });

  return `?${queryParams.toString()}`;
}

// GET /analytics/study
// Fetch study behaviour analytics.
export async function getStudyAnalytics(dateRange) {
  const query = buildDateRangeQuery(dateRange);

  return apiRequest(`/analytics/study${query}`);
}

// GET /analytics/tasks
// Fetch task completion and workload analytics.
export async function getTaskAnalytics(dateRange) {
  const query = buildDateRangeQuery(dateRange);

  return apiRequest(`/analytics/tasks${query}`);
}

// GET /analytics/tests
// Fetch exam and test performance analytics.
export async function getTestAnalytics(dateRange) {
  const query = buildDateRangeQuery(dateRange);

  return apiRequest(`/analytics/tests${query}`);
}

// GET /analytics/heatmap
// Fetch daily study activity for the heatmap.
export async function getHeatmapAnalytics(dateRange) {
  const query = buildDateRangeQuery(dateRange);

  return apiRequest(`/analytics/heatmap${query}`);
}

// GET /insights
// Fetch rule-based study insights.
export async function getInsights(dateRange) {
  const query = buildDateRangeQuery(dateRange);

  return apiRequest(`/insights${query}`);
}
