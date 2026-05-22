import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  shakeKey?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    // 같은 메시지가 이미 떠 있으면 shake만 시키고 중복 추가 안 함
    setToasts((prev) => {
      const existing = prev.find((t) => t.message === message && t.type === type);
      if (existing) {
        return prev.map((t) =>
          t.id === existing.id ? { ...t, shakeKey: (t.shakeKey ?? 0) + 1 } : t
        );
      }
      const id = Math.random().toString(36).substring(2, 9);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
      return [...prev, { id, message, type, shakeKey: 0 }];
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{
                opacity: 1, y: 0, scale: 1,
                x: toast.shakeKey && toast.shakeKey > 0
                  ? [0, -10, 10, -8, 8, -4, 4, 0]
                  : 0
              }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-sm w-max rounded-2xl shadow-xl backdrop-blur-md border border-white/20
                ${
                  toast.type === "success" 
                    ? "bg-[#27D7A1]/90 text-white shadow-[#27D7A1]/20" 
                    : toast.type === "error"
                    ? "bg-red-500/90 text-white shadow-red-500/20"
                    : toast.type === "warning"
                    ? "bg-amber-400/90 text-white shadow-amber-400/20"
                    : "bg-[#1A2340]/90 dark:bg-white/90 text-white dark:text-[#1A2340] shadow-black/10"
                }
              `}
            >
              <div className="shrink-0 drop-shadow-sm">
                {toast.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
                {toast.type === "warning" && <AlertTriangle className="w-5 h-5" />}
                {toast.type === "info" && <Info className="w-5 h-5" />}
              </div>
              <p className="flex-1 text-sm font-bold tracking-tight">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 opacity-60 hover:opacity-100 transition-opacity rounded-full active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
