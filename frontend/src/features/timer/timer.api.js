import { apiRequest } from "../../lib/api";

// Retrieve the user's current timer.
export async function getActiveStudyTimer() {
  return apiRequest("/timer/active", {
    method: "GET",
  });
}

// Start a new timer.
export async function startStudyTimer(payload) {
  return apiRequest("/timer/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Pause the currently running timer.
export async function pauseStudyTimer() {
  return apiRequest("/timer/pause", {
    method: "PATCH",
  });
}

// Resume the currently paused timer.
export async function resumeStudyTimer() {
  return apiRequest("/timer/resume", {
    method: "PATCH",
  });
}

// PROPOSED: Finish timer and create one StudySession.
export async function finishStudyTimer(payload) {
  return apiRequest("/timer/finish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// PROPOSED: Discard timer without creating a StudySession.
export async function discardStudyTimer() {
  return apiRequest("/timer/discard", {
    method: "POST",
  });
}