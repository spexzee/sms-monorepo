import ExcelJS from "exceljs";

export interface ParseConfig {
    expectedColumns: string[];
    columnParsers?: Record<string, (value: any) => any>;
    sheetName?: string;
}

export interface ParseError {
    row: number;
    message: string;
}

export interface ParseResult<T = Record<string, any>> {
    success: boolean;
    data: T[];
    errors: ParseError[];
    skippedRows: number;
}

/**
 * Parse an uploaded Excel file against expected column structure.
 * Returns structured data and per-row errors.
 */
export async function parseExcelFile<T = Record<string, any>>(
    file: File,
    config: ParseConfig
): Promise<ParseResult<T>> {
    const { expectedColumns, columnParsers = {}, sheetName } = config;

    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const sheet = sheetName
        ? workbook.getWorksheet(sheetName) || workbook.getWorksheet(1)
        : workbook.getWorksheet(1);

    if (!sheet) {
        return {
            success: false,
            data: [],
            errors: [{ row: 0, message: "No worksheet found in the file" }],
            skippedRows: 0,
        };
    }

    // Extract and validate headers
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNum) => {
        headers[colNum - 1] = String(cell.value || "").trim();
    });

    const expectedSet = new Set(expectedColumns);
    const headerSet = new Set(headers);

    const missingCols = expectedColumns.filter((c) => !headerSet.has(c));
    const extraCols = headers.filter((h) => h && !expectedSet.has(h));

    if (missingCols.length > 0) {
        return {
            success: false,
            data: [],
            errors: [
                {
                    row: 0,
                    message: `Missing columns: ${missingCols.join(", ")}. Please use the downloaded template.`,
                },
            ],
            skippedRows: 0,
        };
    }

    if (extraCols.length > 0) {
        return {
            success: false,
            data: [],
            errors: [
                {
                    row: 0,
                    message: `Unexpected columns: ${extraCols.join(", ")}. Please use the downloaded template.`,
                },
            ],
            skippedRows: 0,
        };
    }

    // Parse data rows
    const data: T[] = [];
    const errors: ParseError[] = [];
    let skippedRows = 0;

    sheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // Skip header

        const rowData: Record<string, any> = {};
        let hasAnyValue = false;

        headers.forEach((header, idx) => {
            if (!header) return;
            let cellValue = row.getCell(idx + 1).value ?? "";

            // Handle ExcelJS objects (Rich Text, Hyperlinks)
            if (typeof cellValue === "object" && cellValue !== null) {
                if ("richText" in (cellValue as any)) {
                    cellValue = (cellValue as any).richText
                        .map((rt: any) => rt.text)
                        .join("");
                } else if ("text" in (cellValue as any)) {
                    cellValue = (cellValue as any).text;
                }
            }

            // Apply column-specific parser if defined
            if (columnParsers[header]) {
                cellValue = columnParsers[header](cellValue);
            }

            rowData[header] = cellValue;
            if (cellValue !== "" && cellValue !== null && cellValue !== undefined) {
                hasAnyValue = true;
            }
        });

        // Skip completely empty rows
        if (!hasAnyValue) {
            skippedRows++;
            return;
        }

        data.push(rowData as T);
    });

    return {
        success: data.length > 0,
        data,
        errors,
        skippedRows,
    };
}

// ---- Common Parsers ----

/** Split comma-separated string into trimmed array */
export const parseArrayField =
    (separator: string = ",") =>
        (value: any): string[] => {
            const str = String(value || "").trim();
            if (!str) return [];
            return str
                .split(separator)
                .map((s: string) => s.trim())
                .filter(Boolean);
        };

/** Parse boolean from common string representations */
export const parseBooleanField = (value: any): boolean => {
    const str = String(value || "")
        .trim()
        .toLowerCase();
    return str === "true" || str === "1" || str === "yes";
};

/** Trim string and return empty string as undefined */
export const parseOptionalString = (value: any): string | undefined => {
    const str = String(value || "").trim();
    return str || undefined;
};

/** Trim string, required */
export const parseRequiredString = (value: any): string => {
    return String(value || "").trim();
};
