
import { createBrowserRouter } from "react-router-dom";

// Route protection and application layout
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

// Public pages
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegistrationPage from "../pages/RegestrationPage";
import NotFoundPage from "../pages/NotFoundPage";

// Protected application pages
import DashboardPage from "../pages/DashboardPage";
import SubjectsPage from "../features/subjects/SubjectsPage";
import TasksPage from "../features/tasks/TaskPage";
import SessionsPage from "../features/sessions/SessionsPage";
import TimerPage from "../features/timer/TimerPage";
import TestsPage from "../features/tests/TestsPage";
import TestDetail from "../features/tests/components/TestDetails";
import AnalyticsPage from "../features/analytics/AnalyticsPage";
import SettingsPage from "../features/settings/SettingsPage";

export const router = createBrowserRouter([
  // ==========================================
  // PUBLIC ROUTES
  // Accessible without authentication
  // ==========================================

  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/register",
    element: <RegistrationPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },

  // ==========================================
  // PROTECTED APPLICATION ROUTES
  // Authentication required
  // ==========================================

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/subjects",
            element: <SubjectsPage />,
          },
          {
            path: "/tasks",
            element: <TasksPage />,
          },
          {
            path: "/sessions",
            element: <SessionsPage />,
          },
          {
            path: "/timer",
            element: <TimerPage />,
          },
          {
            path: "/tests",
            element: <TestsPage />,
          },
          {
            path: "/tests/:testId",
            element: <TestDetail />,
          },
          {
            path: "/analytics",
            element: <AnalyticsPage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },

  // ==========================================
  // NOT FOUND
  // ==========================================

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
