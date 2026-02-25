import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import {
  Close as CloseIcon,
  Subject as SubjectIcon,
} from "@mui/icons-material";
import { useCreateSubject, useUpdateSubject } from "../../queries/Subject";
import type { Subject, CreateSubjectPayload } from "../../types";

interface SubjectDialogProps {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  editData?: Subject | null;
  initialClassId?: string;
  initialSectionId?: string;
}

const SubjectDialog: React.FC<SubjectDialogProps> = ({
  open,
  onClose,
  schoolId,
  editData,
}) => {
  const isEditMode = !!editData;

  const [formData, setFormData] = useState<CreateSubjectPayload>({
    name: "",
    code: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateSubject(schoolId);
  const updateMutation = useUpdateSubject(schoolId);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        code: editData.code || "",
        description: editData.description || "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
      });
    }
  }, [editData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Subject name is required";
    if (!formData.code.trim()) {
      newErrors.code = "Subject code is required";
    } else if (formData.code.length > 10) {
      newErrors.code = "Code must be 10 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditMode && editData) {
        await updateMutation.mutateAsync({
          subjectId: editData.subjectId,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      handleClose();
    } catch {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
    });
    setErrors({});
    createMutation.reset();
    updateMutation.reset();
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const errorMessage =
    (createMutation.error as { message?: string })?.message ||
    (updateMutation.error as { message?: string })?.message ||
    "Operation failed";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: "primary.50",
              color: "primary.main",
              display: "flex",
            }}
          >
            <SubjectIcon />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isEditMode ? "Edit Subject" : "Add New Subject"}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <Divider />
        <DialogContent sx={{ py: 3 }}>
          {isError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Basic Information
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                name="name"
                label="Subject Name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
                fullWidth
                variant="outlined"
                placeholder="e.g., Mathematics, General Science"
                InputProps={{
                  sx: { borderRadius: 2 },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                name="code"
                label="Code"
                value={formData.code}
                onChange={handleChange}
                error={!!errors.code}
                helperText={errors.code}
                required
                fullWidth
                variant="outlined"
                placeholder="e.g., MATH"
                inputProps={{ style: { textTransform: "uppercase" } }}
                InputProps={{
                  sx: { borderRadius: 2 },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                name="description"
                label="Description (Optional)"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                placeholder="Briefly describe the subject curriculum or objectives..."
                InputProps={{
                  sx: { borderRadius: 2 },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={handleClose}
            color="inherit"
            sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isPending}
            sx={{
              borderRadius: 2,
              px: 4,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
            startIcon={isPending ? <CircularProgress size={20} /> : null}
          >
            {isPending
              ? isEditMode
                ? "Saving..."
                : "Adding..."
              : isEditMode
                ? "Update Subject"
                : "Add Subject"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SubjectDialog;
