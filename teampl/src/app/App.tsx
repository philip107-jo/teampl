import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import { ChatProvider } from "./context/ChatContext";
import { ToastProvider } from "./context/ToastContext";
import { CallProvider } from "./context/CallContext";
import { CallWidget } from "./components/CallWidget";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <DarkModeProvider>
        <ChatProvider>
          <ToastProvider>
            <AuthProvider>
              <CallProvider>
                <RouterProvider router={router} />
                <CallWidget />
              </CallProvider>
            </AuthProvider>
          </ToastProvider>
        </ChatProvider>
      </DarkModeProvider>
    </DndProvider>
  );
}
