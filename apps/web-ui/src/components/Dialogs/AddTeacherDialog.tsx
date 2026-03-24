import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Autocomplete,
  Chip,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useCreateTeacher, useUpdateTeacher } from "../../queries/Teacher";
import { useGetClasses } from "../../queries/Class";
import { useNotification } from "../../hooks/useNotification";
import { useGetSubjects } from "../../queries/Subject";
import type {
  CreateTeacherPayload,
  Teacher,
  Class,
  Subject,
} from "../../types";
import { ImageUpload } from "../ImageUpload";
import { IMAGEKIT_FOLDERS } from "../../utils/imagekit";
import { AppInput } from "../ui/AppInput";
import { AppSelect } from "../ui/AppSelect";
import { AppButton } from "../ui/AppButton";

interface TeacherDialogProps {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  editData?: Teacher | null;
}

const TeacherDialog: React.FC<TeacherDialogProps> = ({
  open,
  onClose,
  schoolId,
  editData,
}) => {
  const isEditMode = !!editData;
  const notification = useNotification();

  const [formData, setFormData] = useState<CreateTeacherPayload>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    subjects: [],
    classes: [],
    sections: [],
    status: "active",
    profileImage: "",
    signature: "",
    classTeacherSectionId: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateTeacher(schoolId);
  const updateMutation = useUpdateTeacher(schoolId);

  // Fetch classes and subjects for dropdowns
  const { data: classesData } = useGetClasses(schoolId);
  const { data: subjectsData } = useGetSubjects(schoolId);

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];

  // Get class options for Autocomplete - format: "Class Name - Section A, B"
  const classOptions = classes
    .filter((c: Class) => c.status === "active")
    .flatMap((c: Class) =>
      c.sections.map((s) => ({
        id: `${c.classId}#${s.sectionId}`,
        label: `${c.name} - ${s.name}`,
      })),
    );

  // Get subject options for Autocomplete
  const subjectOptions = subjects
    .filter((s: Subject) => s.status === "active")
    .map((s: Subject) => ({
      id: s.subjectId,
      label: `${s.name} (${s.code})`,
    }));

  // Get available sections for Class Teacher dropdown
  const allSections = classes.flatMap((c: Class) =>
    c.sections
      .filter(
        (s) =>
          !s.classTeacherId ||
          (editData && s.classTeacherId === editData.teacherId),
      )
      .map((s) => ({
        id: `${c.classId}#${s.sectionId}`,
        label: `${c.name} - ${s.name}`,
      })),
  );

  useEffect(() => {
    if (editData) {
      setFormData({
        firstName: editData.firstName || "",
        lastName: editData.lastName || "",
        email: editData.email || "",
        password: "",
        phone: editData.phone || "",
        subjects: editData.subjects || [],
        classes: editData.classes || [],
        sections: editData.sections || [],
        status: editData.status || "active",
        profileImage: editData.profileImage || "",
        signature: editData.signature || "",
        classTeacherSectionId: editData.classTeacherSectionId || null,
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
        subjects: [],
        classes: [],
        sections: [],
        status: "active",
        profileImage: "",
        signature: "",
        classTeacherSectionId: null,
      });
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEditMode && editData) {
        const updatePayload: Record<string, unknown> = { ...formData };
        if (!formData.password) delete updatePayload.password;
        await updateMutation.mutateAsync({
          teacherId: editData.teacherId,
          data: updatePayload,
        });
        notification.success("Teacher updated successfully");
      } else {
        await createMutation.mutateAsync(formData);
        notification.success("Teacher created successfully");
      }
      handleClose();
    } catch {
      notification.error("Operation failed. Please try again.");
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      subjects: [],
      classes: [],
      sections: [],
      status: "active",
      profileImage: "",
      signature: "",
      classTeacherSectionId: null,
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
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{isEditMode ? "Modify Educator Profile" : "Register New Teacher"}</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Basic Information
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <AppInput
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                required
              />
              <AppInput
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                required
              />
            </Box>

            <AppInput
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <AppInput
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                required={!isEditMode}
                labelHint={isEditMode ? 'Leave blank to keep current' : ''}
              />
              <AppInput
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Academic Assignments
            </Typography>

            {/* Classes Multi-Select */}
            <Autocomplete
              multiple
              options={classOptions}
              getOptionLabel={(option) => option.label}
              value={classOptions.filter((opt) =>
                formData.classes?.includes(opt.id)
              )}
              onChange={(_, newValue) => {
                const newClassIds = newValue.map((v) => v.id);
                const validSections =
                  formData.sections?.filter((sId: string) => {
                    return classes.some(
                      (c) =>
                        newClassIds.includes(c.classId) &&
                        c.sections.some((s) => s.sectionId === sId)
                    );
                  }) || [];
                setFormData((prev) => ({
                  ...prev,
                  classes: newClassIds,
                  sections: validSections,
                }));
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <AppInput
                  {...params}
                  label="Assigned Classes"
                  placeholder="Select classes"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.label}
                    {...getTagProps({ index })}
                    key={option.id}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))
              }
            />

            {/* Sections Multi-Select */}
            {formData.classes && formData.classes.length > 0 && (
              <Autocomplete
                multiple
                options={classes
                  .filter((c) => formData.classes?.includes(c.classId))
                  .flatMap((c) =>
                    c.sections.map((s) => ({
                      id: s.sectionId,
                      label: `${c.name} - ${s.name}`,
                    }))
                  )}
                getOptionLabel={(option) => option.label}
                value={classes
                  .filter((c) => formData.classes?.includes(c.classId))
                  .flatMap((c) =>
                    c.sections
                      .filter((s) => formData.sections?.includes(s.sectionId))
                      .map((s) => ({
                        id: s.sectionId,
                        label: `${c.name} - ${s.name}`,
                      }))
                  )}
                onChange={(_, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    sections: newValue.map((v) => v.id),
                  }));
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <AppInput
                    {...params}
                    label="Assigned Sections"
                    labelHint="Optional"
                    placeholder="Select specific sections"
                    helperText="Leave empty to assign to entire class"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      {...getTagProps({ index })}
                      key={option.id}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  ))
                }
              />
            )}

            {/* Subjects Multi-Select */}
            <Autocomplete
              multiple
              options={subjectOptions}
              getOptionLabel={(option) => option.label}
              value={subjectOptions.filter((opt) =>
                formData.subjects?.includes(opt.id)
              )}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  subjects: newValue.map((v) => v.id),
                }));
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <AppInput
                  {...params}
                  label="Assigned Subjects"
                  placeholder="Select subjects"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.label}
                    {...getTagProps({ index })}
                    key={option.id}
                    color="info"
                    variant="outlined"
                    size="small"
                  />
                ))
              }
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Status & Identification
            </Typography>

            <AppSelect
              label="Account Status"
              value={formData.status || 'active'}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as "active" | "inactive",
                }))
              }
            />

            <Autocomplete
              options={allSections}
              getOptionLabel={(option) => option.label}
              value={
                allSections.find(
                  (opt) => opt.id === formData.classTeacherSectionId
                ) || null
              }
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  classTeacherSectionId: newValue?.id || null,
                }));
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <AppInput
                  {...params}
                  label="Class Teacher Of"
                  labelHint="Optional"
                  placeholder="Select class & section"
                />
              )}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
              <ImageUpload
                folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                fileName={isEditMode && editData ? `${editData.teacherId}_profile` : `new_teacher_profile_${Date.now()}`}
                currentImage={formData.profileImage}
                label="Profile Image"
                authEndpoint="school"
                variant="avatar"
                size="medium"
                onUploadSuccess={(result) => {
                  setFormData((prev) => ({ ...prev, profileImage: result.url }));
                }}
                onRemove={() => {
                  setFormData((prev) => ({ ...prev, profileImage: "" }));
                }}
              />
              <ImageUpload
                folder={IMAGEKIT_FOLDERS.SIGNATURES}
                fileName={isEditMode && editData ? `${editData.teacherId}_signature` : `new_teacher_signature_${Date.now()}`}
                currentImage={formData.signature}
                label="Signature"
                authEndpoint="school"
                size="small"
                onUploadSuccess={(result) => {
                  setFormData((prev) => ({ ...prev, signature: result.url }));
                }}
                onRemove={() => {
                  setFormData((prev) => ({ ...prev, signature: "" }));
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton onClick={handleClose} variant="text" color="inherit">
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            variant="contained"
            loading={isPending}
          >
            {isEditMode ? "Save Changes" : "Create Profile"}
          </AppButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TeacherDialog;
