import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    IconButton,
    Autocomplete,
    Chip,
    Typography,
    Divider,
    Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateParent, useUpdateParent } from '../../queries/Parent';
import { searchStudentsApi } from '../../queries/Student';
import type { CreateParentPayload, Parent, Student } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';
import { AppInput } from '../ui/AppInput';
import { AppSelect } from '../ui/AppSelect';
import { AppButton } from '../ui/AppButton';

interface ParentDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Parent | null;
}

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const ParentDialog: React.FC<ParentDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateParentPayload>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        relationship: 'father',
        occupation: '',
        address: '',
        studentIds: [],
        status: 'active',
        profileImage: '',
        signature: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Student search state
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentOptions, setStudentOptions] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [studentLoading, setStudentLoading] = useState(false);

    const debouncedStudentQuery = useDebounce(studentSearchQuery, 300);

    const createMutation = useCreateParent(schoolId);
    const updateMutation = useUpdateParent(schoolId);

    // Fetch students when search query changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (debouncedStudentQuery.length >= 2) {
                setStudentLoading(true);
                try {
                    const response = await searchStudentsApi(schoolId, debouncedStudentQuery);
                    setStudentOptions(response.data || []);
                } catch {
                    setStudentOptions([]);
                } finally {
                    setStudentLoading(false);
                }
            } else {
                setStudentOptions([]);
            }
        };
        fetchStudents();
    }, [debouncedStudentQuery, schoolId]);

    // Fetch real student details for already-linked students when editing
    useEffect(() => {
        if (!editData || !editData.studentIds || editData.studentIds.length === 0) return;
        const fetchLinkedStudents = async () => {
            const results: Student[] = [];
            for (const id of editData.studentIds!) {
                try {
                    const response = await searchStudentsApi(schoolId, id);
                    const found = (response.data || []).find((s) => s.studentId === id);
                    results.push(found ?? ({ studentId: id, firstName: '', lastName: '', class: '' } as Student));
                } catch {
                    results.push({ studentId: id, firstName: '', lastName: '', class: '' } as Student);
                }
            }
            setSelectedStudents(results);
        };
        fetchLinkedStudents();
    }, [editData, schoolId]);

    useEffect(() => {
        if (editData) {
            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',
                password: '',
                phone: editData.phone || '',
                relationship: editData.relationship || 'father',
                occupation: editData.occupation || '',
                address: editData.address || '',
                studentIds: editData.studentIds || [],
                status: editData.status || 'active',
                profileImage: editData.profileImage || '',
                signature: editData.signature || '',
            });
            // Show placeholder chips immediately; real names load via the effect above
            setSelectedStudents(
                (editData.studentIds || []).map(id => ({ studentId: id, firstName: '', lastName: '', class: '' } as Student))
            );
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                relationship: 'father',
                occupation: '',
                address: '',
                studentIds: [],
                status: 'active',
                profileImage: '',
                signature: '',
            });
            setSelectedStudents([]);
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleStudentSelect = useCallback((_: unknown, value: Student[]) => {
        setSelectedStudents(value);
        setFormData(prev => ({ ...prev, studentIds: value.map(s => s.studentId) }));
    }, []);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!isEditMode && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
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
                    parentId: editData.parentId,
                    data: updatePayload,
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
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
            relationship: 'father',
            occupation: '',
            address: '',
            studentIds: [],
            status: 'active',
            profileImage: '',
            signature: '',
        });
        setErrors({});
        setSelectedStudents([]);
        setStudentSearchQuery('');
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError;
    const errorMessage = (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        'Operation failed';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Edit Parent Profile' : 'Add New Parent'}
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {isError && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Personal Details
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <AppInput name="firstName" label="First Name" value={formData.firstName}
                                onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName}
                                required />
                            <AppInput name="lastName" label="Last Name" value={formData.lastName}
                                onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName}
                                required />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <AppSelect
                                label="Relationship to Student"
                                value={formData.relationship || 'father'}
                                options={[
                                    { value: 'father', label: 'Father' },
                                    { value: 'mother', label: 'Mother' },
                                    { value: 'guardian', label: 'Guardian' },
                                    { value: 'other', label: 'Other' },
                                ]}
                                onChange={(e) => setFormData((prev) => ({ ...prev, relationship: e.target.value as 'father' | 'mother' | 'guardian' | 'other' }))}
                            />
                            <AppInput name="phone" label="Contact Number" value={formData.phone}
                                onChange={handleChange} error={!!errors.phone} helperText={errors.phone}
                                required />
                        </Box>

                        <AppInput name="email" label="Email Address" type="email" value={formData.email}
                            onChange={handleChange} error={!!errors.email} helperText={errors.email}
                            required />

                        <AppInput name="password" label="Account Password"
                            type="password" value={formData.password} onChange={handleChange}
                            error={!!errors.password} helperText={errors.password} required={!isEditMode}
                            labelHint={isEditMode ? 'Leave blank to keep current' : ''} />

                        <Divider sx={{ my: 1 }} />
                        
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Contact & Occupation
                        </Typography>

                        <AppInput name="occupation" label="Occupation" value={formData.occupation}
                            onChange={handleChange} />

                        <AppInput name="address" label="Residential Address" value={formData.address}
                            onChange={handleChange} multiline rows={2} />

                        <Divider sx={{ my: 1 }} />
                        
                        <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
                            Student Connectivity
                        </Typography>

                        {/* Student Search Autocomplete */}
                        <Autocomplete
                            multiple
                            options={studentOptions}
                            value={selectedStudents}
                            onChange={handleStudentSelect}
                            loading={studentLoading}
                            getOptionLabel={(option) =>
                                `${option.studentId} - ${option.firstName} ${option.lastName} (${option.class || 'N/A'})`
                            }
                            isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
                            onInputChange={(_, value) => setStudentSearchQuery(value)}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return (
                                        <Chip
                                            key={key}
                                            label={option.firstName ? `${option.studentId} - ${option.firstName}` : option.studentId}
                                            {...tagProps}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    );
                                })
                            }
                            renderInput={(params) => (
                                <AppInput
                                    {...params}
                                    label="Search & Link Students"
                                    placeholder="Search by ID, name, or email..."
                                    helperText="Type at least 2 characters to search"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {studentLoading && <CircularProgress size={20} />}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
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
                            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                        />

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
                            <ImageUpload
                                folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                                fileName={isEditMode && editData ? `${editData.parentId}_profile` : `new_parent_profile_${Date.now()}`}
                                currentImage={formData.profileImage}
                                label="Profile Image"
                                authEndpoint="school"
                                variant="avatar"
                                size="medium"
                                onUploadSuccess={(result) => {
                                    setFormData(prev => ({ ...prev, profileImage: result.url }));
                                }}
                                onRemove={() => {
                                    setFormData(prev => ({ ...prev, profileImage: '' }));
                                }}
                            />
                            <ImageUpload
                                folder={IMAGEKIT_FOLDERS.SIGNATURES}
                                fileName={isEditMode && editData ? `${editData.parentId}_signature` : `new_parent_signature_${Date.now()}`}
                                currentImage={formData.signature}
                                label="Signature Approval"
                                authEndpoint="school"
                                size="small"
                                onUploadSuccess={(result) => {
                                    setFormData(prev => ({ ...prev, signature: result.url }));
                                }}
                                onRemove={() => {
                                    setFormData(prev => ({ ...prev, signature: '' }));
                                }}
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton type="submit" variant="contained" loading={isPending}>
                        {isEditMode ? 'Update Parent' : 'Create Parent'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ParentDialog;
