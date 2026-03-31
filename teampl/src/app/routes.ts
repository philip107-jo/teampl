import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Tasks from "./pages/Tasks";
import MyPage from "./pages/MyPage";
import Calendar from "./pages/Calendar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import Drive from "./pages/Drive";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "projects", Component: Projects },
          { path: "projects/:projectId", Component: ProjectDetails },
          { path: "tasks", Component: Tasks },
          { path: "mypage", Component: MyPage },
          { path: "calendar", Component: Calendar },
          { path: "chat", Component: Chat },
          { path: "notifications", Component: Notifications },
          { path: "drive", Component: Drive },
        ],
      },
    ],
  },
]);
