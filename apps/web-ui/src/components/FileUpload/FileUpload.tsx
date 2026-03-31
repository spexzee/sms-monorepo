import React, { useState, useRef } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import {
    Box,
    CircularProgress,
    Typography,
    IconButton,
    Alert,
    Stack,
    LinearProgress,
} from '@mui/material';
import axios from 'axios';
import { AppCard } from '../ui/AppCard';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    InsertDriveFile as FileIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
    imagekitConfig,
    getImageKitAuthenticator,
    type AuthEndpoint,
} from '../../utils/imagekit';
import type { AnnouncementAttachment } from '../../types';

export interface FileUploadProps {
    /** ImageKit folder path (e.g., '/announcements') */
    folder: string;
    /** Base file name (timestamp will be appended) */
    baseFileName: string;
    /** Current attachments */
    currentAttachments?: AnnouncementAttachment[];
    /** Callback when upload succeeds */
    onUploadSuccess: (attachments: AnnouncementAttachment[]) => void;
    /** Callback when upload fails */
    onUploadError?: (error: Error) => void;
    /** Label for the upload field */
    label?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Whether upload is disabled */
    disabled?: boolean;
    /** Authentication endpoint type */
    authEndpoint?: AuthEndpoint;
    /** Maximum number of files */
    maxFiles?: number;
}

interface UploadQueueItem {
    id: string;
    file: File;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    result?: AnnouncementAttachment;
}

const getFileIcon = (fileType: string) => {
    // Check if it's an image extension
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType.toLowerCase()) || fileType === 'image') {
        return <ImageIcon color="primary" />;
    }
    // Check if it's a PDF
    if (fileType.toLowerCase() === 'pdf') {
        return <PdfIcon color="error" />;
    }
    // Default for all documents
    return <FileIcon color="action" />;
};

const getFileType = (fileName: string): 'image' | 'pdf' | 'document' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'document';
};

const FileUpload: React.FC<FileUploadProps> = ({
    folder,
    baseFileName,
    currentAttachments = [],
    onUploadSuccess,
    onUploadError,
    label = 'Upload Files',
    required = false,
    disabled = false,
    authEndpoint = 'school',
    maxFiles = 5,
}) => {
    const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(currentAttachments);
    const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const uploadRef = useRef<HTMLInputElement>(null);

    // Manual Upload Function
    const uploadFile = async (item: UploadQueueItem): Promise<AnnouncementAttachment> => {
        try {
            const authenticator = getImageKitAuthenticator(authEndpoint);
            const authParams = await authenticator();

            const formData = new FormData();
            formData.append('file', item.file);
            formData.append('fileName', `${baseFileName}_${Date.now()}_${item.file.name}`);
            formData.append('folder', folder);
            formData.append('publicKey', imagekitConfig.publicKey);
            formData.append('signature', authParams.signature);
            formData.append('expire', authParams.expire.toString());
            formData.append('token', authParams.token);

            const detectedType = getFileType(item.file.name);

            const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
            const response = await axios.post(uploadUrl, formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadQueue(prev => prev.map(q => 
                        q.id === item.id ? { ...q, progress } : q
                    ));
                }
            });

            const result: AnnouncementAttachment = {
                url: response.data.url,
                fileName: response.data.name,
                fileType: detectedType,
                uploadedAt: new Date().toISOString(),
            };

            setUploadQueue(prev => prev.map(q => 
                q.id === item.id ? { ...q, status: 'success', progress: 100, result } : q
            ));

            return result;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
            setUploadQueue(prev => prev.map(q => 
                q.id === item.id ? { ...q, status: 'error', error: errorMsg } : q
            ));
            throw new Error(errorMsg);
        }
    };

    // Handle Change (Multiple Files)
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        // Check if adding these would exceed maxFiles
        const currentTotal = attachments.length + uploadQueue.filter(q => q.status === 'uploading' || q.status === 'success').length;
        if (currentTotal + selectedFiles.length > maxFiles) {
            setGlobalError(`You can only upload a maximum of ${maxFiles} files.`);
            return;
        }

        setGlobalError(null);

        // Prepare items
        const newItems: UploadQueueItem[] = selectedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'uploading',
            progress: 0,
        }));

        setUploadQueue(prev => [...prev, ...newItems]);

        // Start Concurrent Uploads
        const uploadPromises = newItems.map(item => uploadFile(item));
        
        const results = await Promise.allSettled(uploadPromises);

        // Update main attachments list with successful ones
        const successfulUploads = results
            .filter((r): r is PromiseFulfilledResult<AnnouncementAttachment> => r.status === 'fulfilled')
            .map(r => r.value);

        if (successfulUploads.length > 0) {
            const updatedAttachments = [...attachments, ...successfulUploads];
            setAttachments(updatedAttachments);
            onUploadSuccess(updatedAttachments);
        }

        // Keep errored items in queue for display, remove successful ones after 2 seconds
        setTimeout(() => {
            setUploadQueue(prev => prev.filter(q => q.status === 'error'));
        }, 2000);

        // Reset input for next batch
        if (uploadRef.current) uploadRef.current.value = '';
    };

    // Handle remove attachment
    const handleRemove = (index: number) => {
        const newAttachments = attachments.filter((_, i) => i !== index);
        setAttachments(newAttachments);
        onUploadSuccess(newAttachments);
    };

    // Trigger file input click
    const triggerUpload = () => {
        if (!disabled && uploadRef.current && attachments.length < maxFiles) {
            uploadRef.current.click();
        }
    };

    // Get authenticator function for ImageKit
    const authenticator = getImageKitAuthenticator(authEndpoint);

    // Generate unique filename
    const fileName = `${baseFileName}_${Date.now()}`;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
                {label} {required && <span style={{ color: 'red' }}>*</span>}
            </Typography>

            {/* Upload Button */}
            {(attachments.length + uploadQueue.length) < maxFiles && !disabled && (
                <AppCard
                    sx={{
                        border: '2px dashed',
                        borderColor: globalError ? 'error.main' : 'primary.200',
                        textAlign: 'center',
                        p: 4,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                            borderColor: 'primary.main',
                            background: 'rgba(25, 118, 210, 0.04)',
                            transform: 'translateY(-2px)',
                        },
                    }}
                    onClick={triggerUpload}
                    hover={false}
                >
                    <Box sx={{ 
                        display: 'inline-flex', 
                        p: 2, 
                        borderRadius: '50%', 
                        bgcolor: 'primary.50',
                        color: 'primary.main',
                        mb: 2,
                        transition: '0.3s',
                        '.MuiSvgIcon-root': { fontSize: 32 }
                    }}>
                        <UploadIcon />
                    </Box>
                    <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ mb: 0.5 }}>
                        Select Files to Upload
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        PDF, DOCX, Images (Max 5MB per file)
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ px: 1.5, py: 0.5, borderRadius: 10, bgcolor: 'primary.50', color: 'primary.700', fontWeight: 600 }}>
                            {attachments.length}/{maxFiles} Uploaded
                        </Typography>
                    </Box>
                </AppCard>
            )}

            {/* Error Message */}
            {globalError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>{globalError}</Alert>
            )}

            {/* Upload Queue (Active or Errored) */}
            {uploadQueue.length > 0 && (
                <Stack spacing={2}>
                    {uploadQueue.map((item) => (
                        <AppCard 
                            key={item.id} 
                            hover={false} 
                            sx={{ 
                                border: '1px solid', 
                                borderColor: item.status === 'error' ? 'error.200' : 'primary.100',
                                background: item.status === 'error' ? 'rgba(211, 47, 47, 0.02)' : 'rgba(25, 118, 210, 0.02)',
                                p: 0
                            }}
                        >
                            <Box sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ 
                                        p: 1.5, 
                                        borderRadius: 2, 
                                        bgcolor: item.status === 'error' ? 'error.50' : 'primary.50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: item.status === 'error' ? 'error.main' : 'primary.main'
                                    }}>
                                        {getFileIcon(getFileType(item.file.name))}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="body2" noWrap fontWeight={600} color="text.primary">
                                                {item.file.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: item.status === 'error' ? 'error.main' : 'text.secondary' }}>
                                                {Math.round(item.file.size / 1024)} KB
                                            </Typography>
                                        </Box>
                                        
                                        {item.status === 'uploading' && (
                                            <Box sx={{ width: '100%' }}>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={item.progress} 
                                                    sx={{ 
                                                        borderRadius: 10, 
                                                        height: 8, 
                                                        bgcolor: 'primary.50',
                                                        '& .MuiLinearProgress-bar': { borderRadius: 10 }
                                                    }} 
                                                />
                                                <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, display: 'block', fontWeight: 600 }}>
                                                    Uploading... {item.progress}%
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        {item.status === 'error' && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    Error: {item.error}
                                                </Typography>
                                            </Box>
                                        )}

                                        {item.status === 'success' && (
                                            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                ✓ Upload Successful
                                            </Typography>
                                        )}
                                    </Box>
                                    {item.status === 'error' && (
                                        <IconButton 
                                            size="small" 
                                            onClick={() => setUploadQueue(q => q.filter(x => x.id !== item.id))}
                                            sx={{ bgcolor: 'error.50', color: 'error.main', '&:hover': { bgcolor: 'error.100' } }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>
                        </AppCard>
                    ))}
                </Stack>
            )}

            {/* Final Attachments List */}
            {attachments.length > 0 && (
                <Box>
                    <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ mb: 1.5, display: 'block', letterSpacing: 1 }}>
                        ATTACHED ASSETS ({attachments.length})
                    </Typography>
                    <Stack spacing={1.5}>
                        {attachments.map((attachment, index) => (
                            <AppCard
                                key={index}
                                hover={true}
                                sx={{ 
                                    p: 0,
                                    border: '1px solid', 
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    transition: '0.3s',
                                    '&:hover': {
                                        borderColor: 'primary.200',
                                        transform: 'scale(1.01)'
                                    }
                                }}
                            >
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ 
                                        p: 1.5, 
                                        borderRadius: 2, 
                                        bgcolor: 'grey.50',
                                        color: 'text.secondary'
                                    }}>
                                        {getFileIcon(attachment.fileType)}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" noWrap fontWeight={600} color="text.primary">
                                            {attachment.fileName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ px: 1, py: 0.2, borderRadius: 1, bgcolor: 'grey.100', color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem' }}>
                                            {attachment.fileType.toUpperCase()}
                                        </Typography>
                                    </Box>
                                    {!disabled && (
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemove(index)}
                                            sx={{ 
                                                color: 'text.disabled',
                                                '&:hover': { color: 'error.main', bgcolor: 'error.50' }
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </AppCard>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Hidden Input (No longer using IKUpload component wrapper directly for multiple support) */}
            <input
                type="file"
                multiple
                ref={uploadRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
        </Box>
    );
};

export default FileUpload;
