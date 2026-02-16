import ExcelJS from "exceljs";

export interface ColumnValidation {
    type: "list";
    options: string[];
    errorTitle?: string;
    error?: string;
    allowBlank?: boolean;
}

export interface ColumnConfig {
    key: string;
    header: string;
    width?: number;
    readOnly?: boolean;
    validation?: ColumnValidation;
    note?: string;
}

export interface TemplateConfig {
    sheetName: string;
    fileName: string;
    columns: ColumnConfig[];
    data?: Record<string, any>[];
    headerColor?: string;
    readOnlyColor?: string;
}

const DEFAULT_HEADER_COLOR = "FF1976D2";
const DEFAULT_READONLY_COLOR = "FFF0F0F0";
const MAX_VALIDATION_ROWS = 500;

/**
 * Generate and download an Excel template based on the provided configuration.
 * Supports empty templates (for bulk insert) and pre-filled templates (for bulk update).
 */
export async function downloadExcelTemplate(
    config: TemplateConfig
): Promise<void> {
    const {
        sheetName,
        fileName,
        columns,
        data,
        headerColor = DEFAULT_HEADER_COLOR,
        readOnlyColor = DEFAULT_READONLY_COLOR,
    } = config;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    // Set up columns
    sheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || 20,
    }));

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: headerColor },
    };
    headerRow.alignment = { horizontal: "center" };

    // Add data rows if provided (pre-filled mode)
    if (data && data.length > 0) {
        data.forEach((rowData) => {
            const row: Record<string, any> = {};
            columns.forEach((col) => {
                const val = rowData[col.key];
                if (Array.isArray(val)) {
                    row[col.key] = val.join(", ");
                } else if (typeof val === "boolean") {
                    row[col.key] = val ? "true" : "false";
                } else {
                    row[col.key] = val ?? "";
                }
            });
            sheet.addRow(row);
        });
    }

    // Apply read-only styling
    const readOnlyCols = columns
        .map((col, idx) => (col.readOnly ? idx + 1 : -1))
        .filter((i) => i > 0);

    if (readOnlyCols.length > 0) {
        sheet.eachRow((row, rowNum) => {
            if (rowNum > 1) {
                readOnlyCols.forEach((colIdx) => {
                    row.getCell(colIdx).fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: readOnlyColor },
                    };
                });
            }
        });
    }

    // Apply data validations and notes
    columns.forEach((col, idx) => {
        const colLetter = String.fromCharCode(65 + idx); // A, B, C...

        // Add cell note on header
        if (col.note) {
            const headerCell = sheet.getCell(`${colLetter}1`);
            headerCell.note = {
                texts: [{ text: col.note }],
            };
        }

        // Add dropdown validation
        if (col.validation && col.validation.type === "list") {
            const formulae = [`"${col.validation.options.join(",")}"`];
            for (let i = 2; i <= MAX_VALIDATION_ROWS; i++) {
                (sheet.getCell(`${colLetter}${i}`) as any).dataValidation = {
                    type: "list",
                    allowBlank: col.validation.allowBlank ?? true,
                    formulae,
                    showErrorMessage: true,
                    errorTitle: col.validation.errorTitle || "Invalid Value",
                    error:
                        col.validation.error ||
                        `Please select from: ${col.validation.options.join(", ")}`,
                };
            }
        }
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
}
