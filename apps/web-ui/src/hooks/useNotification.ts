import { useNotificationStore } from "../stores/notificationStore";

export const useNotification = () => {
  const { showNotification, hideNotification } = useNotificationStore();

  const success = (message: string) => showNotification(message, "success");
  const error = (message: string) => showNotification(message, "error");
  const warning = (message: string) => showNotification(message, "warning");
  const info = (message: string) => showNotification(message, "info");

  return {
    success,
    error,
    warning,
    info,
    show: showNotification,
    hide: hideNotification,
  };
};
