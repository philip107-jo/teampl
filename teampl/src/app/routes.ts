import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import MyPage from "./pages/MyPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import EditProfile from "./pages/EditProfile";
import Calendar from "./pages/Calendar";
import ProtectedRoute from "./components/ProtectedRoute";
import JoinProject from "./pages/JoinProject";
import Landing from "./pages/Landing";

export const router = createBrowserRouter([
  {
    path: "/join",
    Component: JoinProject,
  },
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
    Component: Landing,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { path: "projects", Component: Projects },
          { path: "projects/:projectId", Component: ProjectDetails },
          { path: "calendar", Component: Calendar },
          { path: "mypage", Component: MyPage },
          { path: "mypage/edit", Component: EditProfile },
          { path: "notifications", Component: Notifications },
        ],
      },
    ],
  },
]);
