import toast from "react-hot-toast";

/**
 * Hook personalizado para manejar notificaciones en toda la aplicación
 * Reemplaza los alert() nativos con notificaciones elegantes
 */
export const useNotification = () => {
  const success = (message: string, duration: number = 4000) => {
    toast.success(message, {
      duration,
      position: "top-center",
      style: {
        background: "#10b981",
        color: "#fff",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#10b981",
      },
    });
  };

  const error = (message: string, duration: number = 4000) => {
    toast.error(message, {
      duration,
      position: "top-center",
      style: {
        background: "#ef4444",
        color: "#fff",
        fontWeight: "500",
      },
      iconTheme: {
        primary: "#fff",
        secondary: "#ef4444",
      },
    });
  };

  const warning = (message: string, duration: number = 4000) => {
    toast(message, {
      duration,
      position: "top-center",
      icon: "⚠️",
      style: {
        background: "#f59e0b",
        color: "#fff",
        fontWeight: "500",
        textAlign: "center",
        fontSize: "20px",
      },
    });
  };

  const info = (message: string, duration: number = 4000) => {
    toast(message, {
      duration,
      position: "top-center",
      icon: "ℹ️",
      style: {
        background: "#3b82f6",
        color: "#fff",
        fontWeight: "500",
        textAlign: "center",
        fontSize: "20px",
      },
    });
  };

  const loading = (message: string) => {
    return toast.loading(message, {
      position: "top-right",
      style: {
        background: "#6b7280",
        color: "#fff",
        fontWeight: "500",
      },
    });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        position: "top-right",
        style: {
          fontWeight: "500",
        },
      }
    );
  };

  return {
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    promise,
  };
};
