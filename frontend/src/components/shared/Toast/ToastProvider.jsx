import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { initializeToast } from "../../../utils/toast";
import styles from "./toast.module.scss";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const MAX_TOASTS = 3;

  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = crypto.randomUUID();
      setToasts((prev) => {
        if (prev.length >= MAX_TOASTS) {
          return [...prev.slice(1), { id, message, type }];
        }
        return [...prev, { id, message, type }];
      });
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    []
  );

  const closeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    initializeToast({ showToast });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
            onClick={() => closeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
