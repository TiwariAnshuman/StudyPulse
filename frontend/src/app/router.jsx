import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegistrationPage from "../pages/RegestrationPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import SubjectsPage from "../features/subjects/SubjectsPage";
export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/register", element: <RegistrationPage /> },
  { path: "/login", element: <LoginPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
  path: "/subjects",
  element: <SubjectsPage />,
},
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);