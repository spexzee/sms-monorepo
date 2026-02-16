import { useState, useRef } from "react";
import { Button, CircularProgress } from "@mui/material";
import {
    Download as DownloadIcon,
    Upload as UploadIcon,
} from "@mui/icons-material";
import {
    downloadExcelTemplate,
    parseExcelFile,
    type TemplateConfig,
    type ParseConfig,
} from "../../utils/excelBulk";
import { useNotificationStore } from "../../stores/notificationStore";

export interface ExcelBulkActionsProps {
    templateConfig: TemplateConfig;
    parseConfig: ParseConfig;
    onUploadComplete: (data: any[]) => Promise<void>;
    downloadButtonText?: string;
    uploadButtonText?: string;
    disabled?: boolean;
}

/**
 * Reusable component providing Download Template + Upload Excel buttons.
 * Works with any entity by passing different configs.
 */
const ExcelBulkActions = ({
    templateConfig,
    parseConfig,
    onUploadComplete,
    downloadButtonText = "Download Template",
    uploadButtonText = "Upload Excel",
    disabled = false,
}: ExcelBulkActionsProps) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showNotification } = useNotificationStore();

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            await downloadExcelTemplate(templateConfig);
            showNotification("Template downloaded successfully", "success");
        } catch (err: any) {
            console.error("Download failed:", err);
            showNotification(err.message || "Failed to download template", "error");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";

        setIsUploading(true);
        try {
            const result = await parseExcelFile(file, parseConfig);

            // Show parsing errors
            if (result.errors.length > 0) {
                const errorMsg = result.errors.map((e) => e.message).join("; ");
                showNotification(errorMsg, "error");
                if (!result.success) return;
            }

            if (result.data.length === 0) {
                showNotification("No data found in the uploaded file", "info");
                return;
            }

            // Pass parsed data to parent handler
            await onUploadComplete(result.data);

            if (result.skippedRows > 0) {
                showNotification(
                    `Processed ${result.data.length} row(s). Skipped ${result.skippedRows} empty row(s).`,
                    "info"
                );
            }
        } catch (err: any) {
            console.error("Upload failed:", err);
            showNotification(
                err.message || "Failed to process uploaded file",
                "error"
            );
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Button
                variant="outlined"
                startIcon={
                    isDownloading ? <CircularProgress size={18} /> : <DownloadIcon />
                }
                onClick={handleDownload}
                disabled={disabled || isDownloading}
                sx={{ textTransform: "none", borderRadius: 2 }}
            >
                {isDownloading ? "Downloading..." : downloadButtonText}
            </Button>

            <Button
                variant="outlined"
                startIcon={
                    isUploading ? <CircularProgress size={18} /> : <UploadIcon />
                }
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                sx={{ textTransform: "none", borderRadius: 2 }}
            >
                {isUploading ? "Uploading..." : uploadButtonText}
            </Button>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={handleUpload}
            />
        </>
    );
};

export default ExcelBulkActions;
