import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton,
    Grid,
    Autocomplete,
    Typography,
    Divider,
    Box,
    TextField,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateStudent, useUpdateStudent } from '../../queries/Student';
import { searchParentsApi } from '../../queries/Parent';
import { useGetClasses } from '../../queries/Class';
import type { CreateStudentPayload, Student, Parent, Class, Section } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';
import { AppInput } from '../ui/AppInput';
import { AppSelect } from '../ui/AppSelect';
import { AppButton } from '../ui/AppButton';

interface StudentDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Student | null;
}

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const StudentDialog: React.FC<StudentDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateStudentPayload>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        class: '',
        section: '',
        rollNumber: '',
        gender: undefined,
        dateOfBirth: '',
        address: '',
        parentId: '',
        status: 'active',
        profileImage: '',
        signature: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [parentOptions, setParentOptions] = useState<Parent[]>([]);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [parentLoading, setParentLoading] = useState(false);

    const debouncedParentQuery = useDebounce(parentSearchQuery, 300);

    const createMutation = useCreateStudent(schoolId);
    const updateMutation = useUpdateStudent(schoolId);

    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];

    const selectedClassData = classes.find((c: Class) => c.classId === formData.class);
    const selectedClassSections = selectedClassData?.sections || [];

    useEffect(() => {
        const fetchParents = async () => {
            if (debouncedParentQuery.length >= 2) {
                setParentLoading(true);
                try {
                    const response = await searchParentsApi(schoolId, debouncedParentQuery);
                    setParentOptions(response.data || []);
                } catch {
                    setParentOptions([]);
                } finally {
                    setParentLoading(false);
                }
            } else {
                setParentOptions([]);
            }
        };
        fetchParents();
    }, [debouncedParentQuery, schoolId]);

    // Fetch real parent details for the linked parent when editing
    useEffect(() => {
        if (!editData?.parentId) return;
        const fetchLinkedParent = async () => {
            try {
                const response = await searchParentsApi(schoolId, editData.parentId!);
                const found = (response.data || []).find((p) => p.parentId === editData.parentId);
                if (found) {
                    setSelectedParent(found);
                } else {
                    // Fallback: split parentName if search returns nothing
                    const nameParts = (editData.parentName || '').split(' ');
                    setSelectedParent({
                        parentId: editData.parentId,
                        firstName: nameParts[0] || 'Parent',
                        lastName: nameParts.slice(1).join(' ') || '(Linked)',
                        email: '',
                        phone: '',
                    } as Parent);
                }
            } catch {
                const nameParts = (editData.parentName || '').split(' ');
                setSelectedParent({
                    parentId: editData.parentId,
                    firstName: nameParts[0] || 'Parent',
                    lastName: nameParts.slice(1).join(' ') || '(Linked)',
                    email: '',
                    phone: '',
                } as Parent);
            }
        };
        fetchLinkedParent();
    }, [editData, schoolId]);

    useEffect(() => {
        if (editData) {
            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',
                password: '',
                phone: editData.phone || '',
                class: editData.class || '',
                section: editData.section || '',
                rollNumber: editData.rollNumber || '',
                gender: editData.gender,
                dateOfBirth: editData.dateOfBirth ? editData.dateOfBirth.split('T')[0] : '',
                address: editData.address || '',
                parentId: editData.parentId || '',
                status: editData.status || 'active',
                profileImage: editData.profileImage || '',
                signature: editData.signature || '',
            });
            // Set placeholder; real data loads via the effect above
            if (editData.parentId) {
                const nameParts = (editData.parentName || '').split(' ');
                setSelectedParent({
                    parentId: editData.parentId,
                    firstName: nameParts[0] || 'Parent',
                    lastName: nameParts.slice(1).join(' ') || '(Linked)',
                    email: '',
                    phone: '',
                } as Parent);
            }
        } else {
            setFormData({
                firstName: '', lastName: '', email: '', password: '', phone: '',
                class: '', section: '', rollNumber: '', gender: undefined,
                dateOfBirth: '', address: '', parentId: '', status: 'active',
                profileImage: '', signature: '',
            });
            setSelectedParent(null);
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const handleParentSelect = useCallback((_: unknown, value: Parent | null) => {
        setSelectedParent(value);
        setFormData(prev => ({ ...prev, parentId: value?.parentId || '' }));
    }, []);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.class.trim()) newErrors.class = 'Class is required';
        if (!isEditMode && !formData.password.trim()) newErrors.password = 'Password is required';
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
                await updateMutation.mutateAsync({ studentId: editData.studentId, data: updatePayload });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch { }
    };

    const handleClose = () => {
        setFormData({
            firstName: '', lastName: '', email: '', password: '', phone: '',
            class: '', section: '', rollNumber: '', gender: undefined,
            dateOfBirth: '', address: '', parentId: '', status: 'active',
            profileImage: '', signature: '',
        });
        setErrors({});
        setSelectedParent(null);
        setParentSearchQuery('');
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                    {isEditMode ? 'Edit Student Profile' : 'Register New Student'}
                </Typography>
                <IconButton onClick={handleClose} size="small" sx={{ bgcolor: 'background.default' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent sx={{ p: 3, pt: 1 }}>
                    {createMutation.isError && <Alert severity="error" sx={{ mb: 3 }}>{(createMutation.error as any)?.message || 'Failed to save'}</Alert>}

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput name="firstName" label="First Name" value={formData.firstName} onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName} required />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput name="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName} required />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <AppInput name="password" label="Portal Password" type="password" value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} required={!isEditMode} labelHint={isEditMode ? 'Leave blank to keep current' : ''} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppSelect
                                label="Assign Class"
                                value={formData.class}
                                error={!!errors.class}
                                helperText={errors.class}
                                options={classes.filter((c: Class) => c.status === 'active').map((c: Class) => ({ value: c.classId, label: c.name }))}
                                onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value as string, section: '' }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppSelect
                                label="Select Section"
                                value={formData.section}
                                disabled={!formData.class}
                                options={[{ value: '', label: 'None' }, ...selectedClassSections.map((s: Section) => ({ value: s.sectionId, label: s.name }))]}
                                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value as string }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppInput name="rollNumber" label="Roll Number" value={formData.rollNumber} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppInput name="phone" label="Phone Number" value={formData.phone} onChange={handleChange} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppSelect
                                label="Gender"
                                value={formData.gender || ''}
                                options={[
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' },
                                    { value: 'other', label: 'Other' }
                                ]}
                                onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as any }))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <AppInput name="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                options={parentOptions}
                                value={selectedParent}
                                onChange={handleParentSelect}
                                loading={parentLoading}
                                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.phone || option.email || 'N/A'})`}
                                onInputChange={(_, value) => setParentSearchQuery(value)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Link to Parent Account" placeholder="Search by name, email, or phone..." variant="outlined" />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <AppInput name="address" label="Home Address" value={formData.address} onChange={handleChange} multiline rows={2} />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Profile Media</Typography>
                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <ImageUpload
                                    folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                                    fileName={isEditMode && editData ? `${editData.studentId}_profile` : `new_student_profile_${Date.now()}`}
                                    currentImage={formData.profileImage}
                                    label="Student Photo"
                                    authEndpoint="school"
                                    variant="avatar"
                                    size="medium"
                                    onUploadSuccess={(result) => setFormData(prev => ({ ...prev, profileImage: result.url }))}
                                    onRemove={() => setFormData(prev => ({ ...prev, profileImage: '' }))}
                                />
                                <ImageUpload
                                    folder={IMAGEKIT_FOLDERS.SIGNATURES}
                                    fileName={isEditMode && editData ? `${editData.studentId}_signature` : `new_student_signature_${Date.now()}`}
                                    currentImage={formData.signature}
                                    label="Signature"
                                    authEndpoint="school"
                                    size="small"
                                    onUploadSuccess={(result) => setFormData(prev => ({ ...prev, signature: result.url }))}
                                    onRemove={() => setFormData(prev => ({ ...prev, signature: '' }))}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <AppButton onClick={handleClose} variant="text" color="inherit">Discard</AppButton>
                    <AppButton type="submit" variant="contained" loading={isPending}>
                        {isEditMode ? 'Update Profile' : 'Confirm Registration'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default StudentDialog;
