import React from "react";
import {
  Dialog,
  Typography,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background: "rgba(30, 41, 59, 0.7)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
          color: "#fff",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Box sx={{ position: "relative", p: 4, textAlign: "center" }}>
              <IconButton
                onClick={onClose}
                sx={{
                  position: "absolute",
                  right: 16,
                  top: 16,
                  color: "rgba(255, 255, 255, 0.5)",
                  "&:hover": { color: "#fff", background: "rgba(255, 255, 255, 0.1)" },
                }}
              >
                <CloseIcon />
              </IconButton>

              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "20px",
                  background: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                <LogoutIcon sx={{ fontSize: 32, color: "#ff6e84" }} />
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  fontFamily: "'Lexend', sans-serif",
                  background: "linear-gradient(135deg, #fff 0%, #cbd5e1 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Confirm Sign Out
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "#94a3b8",
                  mb: 4,
                  lineHeight: 1.6,
                }}
              >
                Are you sure you want to sign out? You will need to log in again to access your account.
              </Typography>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  fullWidth
                  onClick={onClose}
                  sx={{
                    py: 1.5,
                    borderRadius: "14px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "#fff",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.1)",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={onConfirm}
                  variant="contained"
                  sx={{
                    py: 1.5,
                    borderRadius: "14px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
                      boxShadow: "0 6px 20px rgba(239, 68, 68, 0.4)",
                    },
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default LogoutConfirmDialog;
