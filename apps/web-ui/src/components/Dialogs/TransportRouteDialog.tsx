import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    Divider,
    Box,
    Grid,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    TextField,
    Autocomplete,
    CircularProgress,
    Paper,
    Collapse,
    Avatar,
} from '@mui/material';
import {
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    LocationOn as LocationIcon,
    School as SchoolIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useCreateTransportRoute, useUpdateTransportRoute, useGetVehicles, useGetDrivers, useGetTransportRoutes } from '../../queries/transport';
import type { TransportRoute, CreateTransportRoutePayload, TransportStop, TransportStopStudent } from '../../types/transport';
import type { Student } from '../../types';
import { AppInput } from '../shared/AppInput';
import { AppButton } from '../shared/AppButton';
import { Map, MapMarker, MapControls, MarkerContent, MapSearch, MapRoute } from '@/components/ui/map';
import { fetchRoadRoute } from '../../utils/transport_routing';
import { getSchoolOrigin } from '../../config/transportConfig';
import { useGetSchoolById } from '../../queries/School';
import { useGetStudents } from '../../queries/Student';
import TokenService from '../../queries/token/tokenService';
import { useNotificationStore } from '../../stores/notificationStore';

interface TransportRouteDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: TransportRoute | null;
}

// ---------------------------------------------------------------------------
// StudentAutocomplete — debounced multi-select inside the stop editor
// ---------------------------------------------------------------------------
interface StudentAutocompleteProps {
    schoolId: string;
    value: TransportStopStudent[];
    /** Student IDs already assigned to any stop — hidden from the dropdown */
    excludeIds?: Set<string>;
    onChange: (students: TransportStopStudent[]) => void;
}

function StudentAutocomplete({ schoolId, value, excludeIds, onChange }: StudentAutocompleteProps) {
    const [inputValue, setInputValue] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInputChange = useCallback((_: unknown, newInput: string) => {
        setInputValue(newInput);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(newInput.trim()), 400);
    }, []);

    const { data: studentData, isFetching } = useGetStudents(schoolId, {
        search: debouncedQuery || undefined,
        limit: 20,
        status: 'active',
    });

    const students: Student[] = studentData?.data || [];

    const toStopStudent = (s: Student): TransportStopStudent => ({
        studentId: s.studentId,
        firstName: s.firstName,
        lastName: s.lastName,
        class: s.class,
        className: s.className,
        section: s.section,
        sectionName: s.sectionName,
    });

    // Hide: already selected in this widget OR globally assigned to another stop
    const selectedIds = new Set(value.map(v => v.studentId));
    const options: Student[] = students.filter(s =>
        !selectedIds.has(s.studentId) &&
        !(excludeIds?.has(s.studentId))
    );

    return (
        <Autocomplete
            multiple
            disableCloseOnSelect
            options={options}
            value={[]} // always empty — we manage selection via `value` prop externally
            inputValue={inputValue}
            onInputChange={handleInputChange}
            loading={isFetching}
            getOptionLabel={(opt) => `${opt.firstName} ${opt.lastName}`}
            isOptionEqualToValue={(a, b) => a.studentId === b.studentId}
            onChange={(_, newSelections) => {
                // Add newly selected to the current value list (avoiding duplicates)
                const toAdd = newSelections.filter(
                    s => !selectedIds.has(s.studentId)
                );
                onChange([...value, ...toAdd.map(toStopStudent)]);
                setInputValue('');
                setDebouncedQuery('');
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    size="small"
                    label="Add students"
                    placeholder="Type name to search..."
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {isFetching && <CircularProgress size={14} />}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <li {...props} key={option.studentId}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: 'primary.light' }}>
                            {option.firstName[0]}{option.lastName[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="body2">{option.firstName} {option.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {option.className || option.class} {option.sectionName && `• ${option.sectionName}`}
                            </Typography>
                        </Box>
                    </Box>
                </li>
            )}
            noOptionsText={debouncedQuery.length < 1 ? 'Type to search students' : 'No students found'}
            filterOptions={(x) => x} // server-side search, disable client filter
            sx={{ mt: 1 }}
        />
    );
}

// ---------------------------------------------------------------------------
// StopList — shows stops with edit and delete buttons
// ---------------------------------------------------------------------------
interface StopListProps {
    stops: Partial<TransportStop>[];
    schoolId: string;
    /** All student IDs already assigned across all stops (for global exclusion) */
    allAssignedIds: Set<string>;
    onRemove: (index: number) => void;
    onUpdateStudents: (index: number, students: TransportStopStudent[]) => void;
    onUpdateStopField: (index: number, field: keyof TransportStop, value: unknown) => void;
}

function StopList({ stops, schoolId, allAssignedIds, onRemove, onUpdateStudents, onUpdateStopField }: StopListProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    return (
        <List dense disablePadding>
            {stops.map((stop, i) => (
                <React.Fragment key={i}>
                    <ListItem
                        sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            pr: 10,
                            bgcolor: editingIndex === i ? 'action.selected' : 'transparent',
                            borderRadius: editingIndex === i ? 1 : 0,
                        }}
                    >
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {i + 1}. {stop.name}
                                    </Typography>
                                    {(stop.students?.length ?? 0) > 0 && (
                                        <Chip
                                            size="small"
                                            icon={<PersonIcon sx={{ fontSize: '12px !important' }} />}
                                            label={stop.students!.length}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ height: 18, '& .MuiChip-label': { px: 0.5, fontSize: 10 } }}
                                        />
                                    )}
                                </Box>
                            }
                            secondary={`Pickup: ${stop.pickupTime || '—'} | Drop: ${stop.dropTime || '—'}`}
                        />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                size="small"
                                color={editingIndex === i ? 'primary' : 'default'}
                                onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                                sx={{ mr: 0.5 }}
                            >
                                {editingIndex === i ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                            </IconButton>
                            <IconButton edge="end" size="small" color="error" onClick={() => {
                                if (editingIndex === i) setEditingIndex(null);
                                onRemove(i);
                            }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>

                    {/* Inline Stop Editor */}
                    <Collapse in={editingIndex === i} unmountOnExit>
                        <Paper variant="outlined" sx={{ m: 1, p: 1.5, borderRadius: 1.5, bgcolor: 'background.default' }}>
                            <Typography variant="caption" color="primary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                                Edit Stop — {stop.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                <TextField
                                    size="small"
                                    label="Stop Name"
                                    value={stop.name || ''}
                                    onChange={e => onUpdateStopField(i, 'name', e.target.value)}
                                    sx={{ flex: 1 }}
                                />
                                <TextField
                                    size="small"
                                    label="Pickup"
                                    type="time"
                                    value={stop.pickupTime || ''}
                                    onChange={e => onUpdateStopField(i, 'pickupTime', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ width: 120 }}
                                />
                                <TextField
                                    size="small"
                                    label="Drop"
                                    type="time"
                                    value={stop.dropTime || ''}
                                    onChange={e => onUpdateStopField(i, 'dropTime', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ width: 120 }}
                                />
                            </Box>

                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Assigned Students
                            </Typography>

                            {/* Currently assigned chips */}
                            {(stop.students?.length ?? 0) > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: 0.5 }}>
                                    {stop.students!.map(s => (
                                        <Chip
                                            key={s.studentId}
                                            size="small"
                                            avatar={
                                                <Avatar sx={{ width: 20, height: 20, fontSize: 9 }}>
                                                    {s.firstName?.[0]}{s.lastName?.[0]}
                                                </Avatar>
                                            }
                                            label={`${s.firstName} ${s.lastName}`}
                                            onDelete={() => onUpdateStudents(i, stop.students!.filter(x => x.studentId !== s.studentId))}
                                            sx={{ fontSize: 11 }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Search & add students — exclude IDs assigned to OTHER stops */}
                            <StudentAutocomplete
                                schoolId={schoolId}
                                value={stop.students || []}
                                excludeIds={new Set([...allAssignedIds].filter(id => !(stop.students || []).some(s => s.studentId === id)))}
                                onChange={(students) => onUpdateStudents(i, students)}
                            />
                        </Paper>
                    </Collapse>
                </React.Fragment>
            ))}
            {stops.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No stops added. Use the form and map to add stops.
                </Typography>
            )}
        </List>
    );
}

// ---------------------------------------------------------------------------
// Main Dialog
// ---------------------------------------------------------------------------

const TransportRouteDialog: React.FC<TransportRouteDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;
    const resolvedSchoolId = schoolId || TokenService.getSchoolId() || '';

    const [formData, setFormData] = useState<CreateTransportRoutePayload>({
        routeId: '',
        routeName: '',
        vehicleNumber: '', // UI maps busNumber -> vehicleNumber
        vehicleId: '',
        driverId: '',
        driverName: '',
        driverPhone: '',
        licenseNumber: '',
        stops: [],
        status: 'active',
    });
    const { showNotification } = useNotificationStore();

    const [newStop, setNewStop] = useState<TransportStop>({
        stopId: '',
        name: '',
        latitude: 12.9716,
        longitude: 77.5946,
        coordinates: [77.5946, 12.9716],
        pickupTime: '',
        dropTime: '',
        order: 0,
        students: [],
    });

    const [mapCenter, setMapCenter] = useState<[number, number]>([77.5946, 12.9716]);
    const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
    const [isRouting, setIsRouting] = useState(false);

    const { data: schoolData } = useGetSchoolById(resolvedSchoolId);
    const schoolOrigin = useMemo(() => getSchoolOrigin(schoolData?.data), [schoolData?.data]);

    const createMutation = useCreateTransportRoute(resolvedSchoolId);
    const updateMutation = useUpdateTransportRoute(resolvedSchoolId);
    
    const { data: vehiclesData } = useGetVehicles(resolvedSchoolId);
    const { data: driversData } = useGetDrivers(resolvedSchoolId);
    const { data: allRoutesData } = useGetTransportRoutes(resolvedSchoolId);
    
    const vehicles = vehiclesData?.data || [];
    const drivers = driversData?.data || [];
    const allRoutes = allRoutesData?.data || [];

    // Filter out drivers and vehicles already assigned to OTHER routes
    const availableVehicles = useMemo(() => {
        const busyVehicleIds = new Set(
            allRoutes
                .filter(r => !isEditMode || r._id !== editData?._id)
                .map(r => r.vehicleId)
                .filter(Boolean)
        );
        return vehicles.filter(v => !busyVehicleIds.has(v.vehicleId));
    }, [vehicles, allRoutes, isEditMode, editData]);

    const availableDrivers = useMemo(() => {
        const busyDriverIds = new Set(
            allRoutes
                .filter(r => !isEditMode || r._id !== editData?._id)
                .map(r => r.driverId)
                .filter(Boolean)
        );
        return drivers.filter(d => !busyDriverIds.has(d.driverId));
    }, [drivers, allRoutes, isEditMode, editData]);

    // Map center from school origin or geolocation
    useEffect(() => {
        if (!open) return;
        if (schoolOrigin) { setMapCenter([schoolOrigin.longitude, schoolOrigin.latitude]); return; }
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setMapCenter([pos.coords.longitude, pos.coords.latitude]),
                () => {}
            );
        }
    }, [open, schoolOrigin]);

    // Reset / prefill form when dialog opens
    useEffect(() => {
        if (!open) return;
        if (editData) {
            setFormData({
                routeId: editData.routeId || '',
                routeName: editData.routeName || '',
                vehicleNumber: editData.busNumber || editData.vehicleNumber || '',
                vehicleId: editData.vehicleId || '',
                driverId: editData.driverId || '',
                driverName: editData.driver?.name || editData.driverName || '',
                driverPhone: editData.driver?.phone || editData.driverPhone || '',
                licenseNumber: editData.driver?.licenseNumber || editData.licenseNumber || '',
                stops: editData.stops || [],
                status: editData.status || 'active',
            });
            if (editData.stops?.[0]) {
                const s = editData.stops[0];
                setMapCenter([s.longitude || s.coordinates?.[0] || 77.5946, s.latitude || s.coordinates?.[1] || 12.9716]);
            }
        } else {
            setFormData({
                routeId: `RT-${Math.floor(100000 + Math.random() * 900000)}`,
                routeName: '',
                vehicleNumber: '',
                vehicleId: '',
                driverId: '',
                driverName: '',
                driverPhone: '',
                licenseNumber: '',
                stops: [],
                status: 'active',
            });
            setRoadRoute([]);
            setNewStop({
                stopId: '',
                name: '',
                latitude: 12.9716,
                longitude: 77.5946,
                coordinates: [77.5946, 12.9716],
                pickupTime: '',
                dropTime: '',
                order: 0,
                students: [],
            });
        }
    }, [open, editData]);

    // All student IDs currently assigned to any stop (for global dedup across Add Stop + StopList)
    const allAssignedIds = useMemo(() => {
        const ids = new Set<string>();
        for (const stop of formData.stops) {
            for (const s of (stop as TransportStop).students || []) {
                ids.add(s.studentId);
            }
        }
        // Also include students being added in the current new-stop form
        for (const s of newStop.students || []) {
            ids.add(s.studentId);
        }
        return ids;
    }, [formData.stops, newStop.students]);

    useEffect(() => {
        const stops = formData.stops.map(s => ({
            longitude: (s as TransportStop).longitude || s.coordinates?.[0] || 0,
            latitude: (s as TransportStop).latitude || s.coordinates?.[1] || 0,
        }));
        if (stops.length === 0 && !schoolOrigin) { setRoadRoute([]); return; }
        setIsRouting(true);
        const origin = schoolOrigin ? { longitude: schoolOrigin.longitude, latitude: schoolOrigin.latitude } : undefined;
        fetchRoadRoute(stops, origin).then(r => { setRoadRoute(r); setIsRouting(false); });
    }, [formData.stops, schoolOrigin]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStop = () => {
        if (!newStop.name || !newStop.pickupTime) return;
        const stopToAdd = { ...newStop, stopId: `stop_${Date.now()}`, order: formData.stops.length };
        setFormData(prev => ({ ...prev, stops: [...prev.stops, stopToAdd] }));
        setNewStop({
            stopId: '', name: '',
            latitude: mapCenter[1], longitude: mapCenter[0],
            coordinates: [mapCenter[0], mapCenter[1]],
            pickupTime: '', dropTime: '', order: 0, students: [],
        });
    };

    const handleRemoveStop = (index: number) => {
        setFormData(prev => ({
            ...prev,
            stops: prev.stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
        }));
    };

    const handleUpdateStudents = (index: number, students: TransportStopStudent[]) => {
        setFormData(prev => ({
            ...prev,
            stops: prev.stops.map((s, i) => i === index ? { ...s, students } : s),
        }));
    };

    const handleUpdateStopField = (index: number, field: keyof TransportStop, value: unknown) => {
        setFormData(prev => ({
            ...prev,
            stops: prev.stops.map((s, i) => i === index ? { ...s, [field]: value } : s),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Explicitly sync busNumber and driver object for backend consistency
            const payload: CreateTransportRoutePayload = {
                ...formData,
                busNumber: formData.vehicleNumber,
                driver: {
                    name: formData.driverName || '',
                    phone: formData.driverPhone || '',
                    licenseNumber: formData.licenseNumber || '',
                },
            };
            
            if (isEditMode && editData) {
                await updateMutation.mutateAsync({ routeId: editData._id, data: payload });
                showNotification('Transport route updated successfully', 'success');
            } else {
                await createMutation.mutateAsync(payload);
                showNotification('Transport route created successfully', 'success');
            }
            onClose();
        } catch (err: any) {
            showNotification(err?.message || 'Failed to save transport route', 'error');
        }
    };

    const handleMapClick = (lngLat: { lng: number; lat: number }) => {
        setNewStop(prev => ({ ...prev, latitude: lngLat.lat, longitude: lngLat.lng, coordinates: [lngLat.lng, lngLat.lat] }));
        setMapCenter([lngLat.lng, lngLat.lat]);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundImage: 'none',
                    p: 0,
                },
            }}
        >
            <DialogTitle sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid', borderColor: 'divider', py: 1.5, px: 2.5,
            }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {isEditMode ? 'Edit Transport Route' : 'Create New Route'}
                </Typography>
                <IconButton onClick={onClose} size="small" sx={{ bgcolor: 'action.hover' }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={3}>
                        {/* ── Left Column: Route Info + Add Stop ── */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>Route Details</Typography>
                                <AppInput name="routeName" label="Route Name" value={formData.routeName} onChange={handleChange} required />
                                <AppInput name="routeId" label="Route ID" value={formData.routeId} onChange={handleChange} required disabled={isEditMode} />
                                
                                <Autocomplete
                                    options={availableVehicles}
                                    getOptionLabel={(opt) => `${opt.name} (${opt.plateNumber})`}
                                    value={vehicles.find(v => v.vehicleId === formData.vehicleId) || null}
                                    onChange={(_, val) => setFormData({...formData, vehicleId: val?.vehicleId || '', vehicleNumber: val?.plateNumber || ''})}
                                    renderInput={(params) => <TextField {...params} label="Select Vehicle" size="small" required />}
                                    sx={{ mb: 1 }}
                                />

                                <Divider sx={{ my: 1 }} />
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>Driver Selection</Typography>
                                
                                <Autocomplete
                                    options={availableDrivers}
                                    getOptionLabel={(opt) => `${opt.firstName} ${opt.lastName} (Driver ID: ${opt.driverId})`}
                                    value={drivers.find(d => d.driverId === formData.driverId) || null}
                                    onChange={(_, val) => setFormData({
                                        ...formData, 
                                        driverId: val?.driverId || '', 
                                        driverName: val ? `${val.firstName} ${val.lastName}` : '',
                                        driverPhone: val?.phone || '',
                                        licenseNumber: val?.licenseNumber || ''
                                    })}
                                    renderInput={(params) => <TextField {...params} label="Select Driver" size="small" required />}
                                    sx={{ mb: 1 }}
                                />
                                
                                {formData.driverId && (
                                    <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.05)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Driver Details:</Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>Phone: {formData.driverPhone}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>License: {formData.licenseNumber}</Typography>
                                    </Box>
                                )}

                                <Divider sx={{ my: 1 }} />
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>Add Stop</Typography>
                                <AppInput
                                    label="Stop Name"
                                    value={newStop.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStop(prev => ({ ...prev, name: e.target.value }))}
                                />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <AppInput
                                        label="Pickup Time" type="time"
                                        value={newStop.pickupTime}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStop(prev => ({ ...prev, pickupTime: e.target.value }))}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                    <AppInput
                                        label="Drop Time" type="time"
                                        value={newStop.dropTime}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStop(prev => ({ ...prev, dropTime: e.target.value }))}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                    <LocationIcon color="action" fontSize="small" />
                                    <Typography variant="caption" color="text.secondary">
                                        Click map to set stop: {newStop.longitude.toFixed(4)}, {newStop.latitude.toFixed(4)}
                                    </Typography>
                                </Box>

                                {/* Students for this new stop */}
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Assign Students to Stop
                                    </Typography>
                                    {(newStop.students?.length ?? 0) > 0 && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, mb: 0.5 }}>
                                            {newStop.students!.map(s => (
                                                <Chip
                                                    key={s.studentId}
                                                    size="small"
                                                    avatar={
                                                        <Avatar sx={{ width: 20, height: 20, fontSize: 9 }}>
                                                            {s.firstName?.[0]}{s.lastName?.[0]}
                                                        </Avatar>
                                                    }
                                                    label={`${s.firstName} ${s.lastName}`}
                                                    onDelete={() => setNewStop(prev => ({
                                                        ...prev,
                                                        students: prev.students?.filter(x => x.studentId !== s.studentId) || [],
                                                    }))}
                                                    sx={{ fontSize: 11 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                    <StudentAutocomplete
                                        schoolId={resolvedSchoolId}
                                        value={newStop.students || []}
                                        excludeIds={allAssignedIds}
                                        onChange={(students) => setNewStop(prev => ({ ...prev, students }))}
                                    />
                                </Box>

                                <Button
                                    startIcon={<AddIcon />}
                                    variant="outlined"
                                    onClick={handleAddStop}
                                    disabled={!newStop.name || !newStop.pickupTime}
                                >
                                    Add to Route
                                </Button>
                            </Box>
                        </Grid>

                        {/* ── Right Column: Map + Stops List ── */}
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                                {/* Map */}
                                <Box sx={{ height: '300px', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                    <Map
                                        center={mapCenter}
                                        zoom={14}
                                        className="h-full w-full"
                                        onClick={(e: any) => handleMapClick(e.lngLat)}
                                    >
                                        <MapSearch position="top-right" onResultSelect={(res) => setMapCenter([res.longitude, res.latitude])} />
                                        <MapControls showZoom showLocate />

                                        {schoolOrigin && (
                                            <MapMarker longitude={schoolOrigin.longitude} latitude={schoolOrigin.latitude}>
                                                <MarkerContent>
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-900 text-white shadow-xl">
                                                        <SchoolIcon sx={{ fontSize: 16 }} />
                                                    </div>
                                                </MarkerContent>
                                            </MapMarker>
                                        )}

                                        {roadRoute.length > 0 && (
                                            <MapRoute coordinates={roadRoute} color="#4F46E5" width={4} opacity={0.8} />
                                        )}

                                        {isRouting && (
                                            <Box sx={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', bgcolor: 'background.paper', px: 2, py: 0.5, borderRadius: 20, boxShadow: 1, zIndex: 10 }}>
                                                <Typography variant="caption">Calculating road path...</Typography>
                                            </Box>
                                        )}

                                        {formData.stops.map((stop: any, i: number) => (
                                            <MapMarker
                                                key={i}
                                                longitude={stop.longitude || stop.coordinates?.[0]}
                                                latitude={stop.latitude || stop.coordinates?.[1]}
                                            >
                                                <MarkerContent>
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-[10px] font-bold text-white shadow-md">
                                                        {i + 1}
                                                    </div>
                                                </MarkerContent>
                                            </MapMarker>
                                        ))}

                                        <MapMarker
                                            longitude={newStop.longitude}
                                            latitude={newStop.latitude}
                                            draggable
                                            onDragEnd={(lngLat: { lng: number; lat: number }) =>
                                                setNewStop(prev => ({ ...prev, latitude: lngLat.lat, longitude: lngLat.lng, coordinates: [lngLat.lng, lngLat.lat] }))
                                            }
                                        >
                                            <MarkerContent>
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-lg">
                                                    <LocationIcon sx={{ fontSize: 16, color: 'white' }} />
                                                </div>
                                            </MarkerContent>
                                        </MapMarker>
                                    </Map>
                                </Box>

                                {/* Stops List */}
                                <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
                                    Route Stops ({formData.stops.length})
                                </Typography>
                                <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: '340px' }}>
                                    <StopList
                                        stops={formData.stops}
                                        schoolId={resolvedSchoolId}
                                        allAssignedIds={allAssignedIds}
                                        onRemove={handleRemoveStop}
                                        onUpdateStudents={handleUpdateStudents}
                                        onUpdateStopField={handleUpdateStopField}
                                    />
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <AppButton onClick={onClose} variant="text" color="inherit">Cancel</AppButton>
                    <AppButton type="submit" variant="contained" loading={isPending} disabled={formData.stops.length === 0}>
                        {isEditMode ? 'Save Changes' : 'Create Route'}
                    </AppButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default TransportRouteDialog;
