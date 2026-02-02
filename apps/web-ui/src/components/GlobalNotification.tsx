import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { useNotificationStore } from "../stores/notificationStore";

const GlobalNotification: React.FC = () => {
  const { open, message, severity, hideNotification } = useNotificationStore();

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") {
      return;
    }
    hideNotification();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          minWidth: "300px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          borderRadius: "8px",
          fontWeight: 500,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalNotification;
