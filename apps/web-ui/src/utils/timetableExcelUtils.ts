import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type {
    TimetableConfig,
    CreateTimetableEntryRequest,
    TimetableEntry
} from "../types/timetable.types";
import type { Subject, Teacher } from "../types";

/**
 * Generates an Excel template for a specific class and section.
 */
export const generateTimetableTemplate = async (
    config: TimetableConfig,
    subjects: Subject[],
    teachers: Teacher[],
    className: string,
    sectionName: string,
    existingEntries: TimetableEntry[] = []
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Timetable");
    const metaSheet = workbook.addWorksheet("Metadata");

    // 1. Prepare Metadata (IDs and Names)
    const dropdownOptions: string[] = [];

    // Combine subjects and teachers, but filter by assigned subjects
    subjects.forEach(subject => {
        // Find teachers assigned to this subject
        const assignedTeachers = teachers.filter(t => t.subjects && t.subjects.includes(subject.subjectId));

        // Use assigned teachers if available, otherwise fallback to all teachers
        const targetTeachers = assignedTeachers.length > 0 ? assignedTeachers : teachers;

        targetTeachers.forEach(teacher => {
            const label = `${subject.name} (${subject.code}) | ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`;
            dropdownOptions.push(label);
        });
    });

    // Populate Metadata sheet
    dropdownOptions.forEach((option, index) => {
        metaSheet.getCell(index + 1, 1).value = option;
    });

    // Create a named range for the dropdown options
    const lastRow = dropdownOptions.length || 1; // Fallback to 1 if no options
    workbook.definedNames.add(`Metadata!$A$1:$A$${lastRow}`, "ScheduleOptions");

    // Hide metadata sheet
    metaSheet.state = "hidden";

    // 2. Format Timetable Sheet
    const days = config.workingDays.map(d => d.charAt(0).toUpperCase() + d.slice(1));
    const headers = ["Period / Time", ...days];
    sheet.getRow(1).values = headers;
    sheet.getRow(1).height = 30;
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1976D2" } // Primary Blue
    };

    // Set columns width
    sheet.columns = [
        { width: 30 }, // Period
        ...config.workingDays.map(() => ({ width: 45 })) // Days
    ];

    // Style helper for borders
    const borderStyle: Partial<ExcelJS.Borders> = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
    };

    // Add rows for each period
    config.periods.forEach((period, idx) => {
        const rowNum = idx + 2;
        const periodLabel = `${period.name}\n(${period.startTime} - ${period.endTime})`;
        const row = sheet.getRow(rowNum);
        row.height = 45;

        const firstCell = row.getCell(1);
        firstCell.value = periodLabel;
        firstCell.font = { bold: true };
        firstCell.alignment = { wrapText: true, horizontal: "center", vertical: "middle" };
        firstCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" }
        };
        firstCell.border = borderStyle;
        firstCell.protection = { locked: true };

        const isNonTeachingRow = period.type === "break" || period.type === "lunch";

        // Add validation and existing data to each day cell in this row
        for (let i = 2; i <= config.workingDays.length + 1; i++) {
            const cell = row.getCell(i);
            const dayName = config.workingDays[i - 2].toLowerCase();
            cell.border = borderStyle;
            cell.alignment = { horizontal: "center", vertical: "middle" };

            // Lock headers and non-teaching rows
            cell.protection = { locked: isNonTeachingRow };

            if (!isNonTeachingRow) {
                // Find existing entry for this cell
                const entry = existingEntries.find(e =>
                    e.periodNumber === period.periodNumber &&
                    e.dayOfWeek.toLowerCase() === dayName
                );

                if (entry) {
                    const subject = subjects.find(s => s.subjectId === entry.subjectId);
                    const teacher = teachers.find(t => t.teacherId === entry.teacherId);
                    if (subject && teacher) {
                        cell.value = `${subject.name} (${subject.code}) | ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`;
                    }
                }

                cell.dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: ["=ScheduleOptions"],
                    showErrorMessage: true,
                    errorTitle: "Invalid Selection",
                    error: "Please select a valid Subject | Teacher combination from the dropdown."
                };
            } else {
                // For breaks/lunch, mark as non-editable
                cell.value = period.type.toUpperCase();
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE0E0E0" }
                };
                cell.font = { bold: true, color: { argb: "FF757575" } };
            }
        }
    });

    // Apply sheet protection
    sheet.protect("", {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertRows: false,
        deleteRows: false,
        insertColumns: false,
        deleteColumns: false,
    });

    // Export
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Timetable_Template_${className}_${sectionName}.xlsx`);
};

/**
 * Parses an uploaded Excel template and extracts timetable entries.
 */
export const parseTimetableTemplate = async (
    file: File,
    config: TimetableConfig,
    classId: string,
    sectionId: string,
    subjects: Subject[]
): Promise<CreateTimetableEntryRequest[]> => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.getWorksheet("Timetable");
    if (!sheet) throw new Error("Invalid template: 'Timetable' sheet not found.");

    const entries: CreateTimetableEntryRequest[] = [];

    // Map day name to dayOfWeek key
    const dayMap = config.workingDays.map(d => d.toLowerCase());

    // Iterate through period rows
    config.periods.forEach((period, pIdx) => {
        if (period.type !== "regular" && period.type !== "lab") return;

        const rowNum = pIdx + 2;
        const row = sheet.getRow(rowNum);

        // Iterate through day columns
        dayMap.forEach((day, dIdx) => {
            const colNum = dIdx + 2;
            const cellValue = row.getCell(colNum).value;

            if (cellValue && typeof cellValue === "string") {
                // Parse "Subject Name (Code) | Teacher Name (TeacherID)"
                const parts = cellValue.split("|").map(p => p.trim());
                if (parts.length === 2) {
                    const subjectPart = parts[0];
                    const teacherPart = parts[1];

                    // Match Subject by Name and Code: "Subject Name (Code)"
                    const subMatch = subjectPart.match(/^(.*?)\s*\(([^)]+)\)$/);
                    let foundSubjectId = "";

                    if (subMatch) {
                        const subName = subMatch[1].trim();
                        const subCode = subMatch[2].trim();
                        const subject = subjects.find(s => 
                            s.name.trim() === subName && 
                            s.code.trim() === subCode
                        );
                        if (subject) foundSubjectId = subject.subjectId;
                    }

                    // Extract Teacher ID from "(TCHXXXXX)"
                    const teacherMatch = teacherPart.match(/\(([^)]+)\)$/);
                    const teacherId = teacherMatch ? teacherMatch[1] : "";

                    if (foundSubjectId && teacherId) {
                        entries.push({
                            classId,
                            sectionId,
                            subjectId: foundSubjectId,
                            teacherId,
                            dayOfWeek: day,
                            periodNumber: period.periodNumber,
                            periodType: period.type as any
                        });
                    }
                }
            }
        });
    });

    return entries;
};
