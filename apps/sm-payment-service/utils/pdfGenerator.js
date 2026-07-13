const PDFDocument = require('pdfkit');

/**
 * PDF Generator Utility using pdfkit
 * Generates structured, legal invoices/receipts as PDF binary streams.
 * Uses standard fonts and standard INR currency notation for native rendering.
 */

/**
 * Layouts a fee receipt PDF to the target stream.
 *
 * @param {Object} receiptData - Snapshot of receipt details from the database
 * @param {Object} outputStream - Node.js writable stream (e.g. HTTP response)
 */
const generateReceiptPDF = (receiptData, outputStream) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.pipe(outputStream);

    // 1. School Header
    const school = receiptData.school || {};
    doc.font('Helvetica-Bold').fontSize(18).text(school.schoolName || 'SCHOOL SYSTEM RECEIPT', { align: 'center' });
    doc.font('Helvetica').fontSize(10).fillColor('#555555')
        .text(school.schoolAddress || '', { align: 'center' })
        .text(`Phone: ${school.schoolPhone || 'N/A'} | Email: ${school.schoolEmail || 'N/A'}`, { align: 'center' });
    doc.moveDown(1.5);

    // 2. Receipt Subtitle
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text(
        receiptData.isVoided ? 'VOIDED FEE RECEIPT' : 'FEE PAYMENT RECEIPT', 
        { align: 'center', underline: true }
    );
    doc.moveDown(1);

    // 3. Metadata Grid (Student and Receipt details)
    const startY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).text('Receipt Details:', 50, startY);
    doc.font('Helvetica')
        .text(`Receipt No: ${receiptData.receiptNumber}`, 50, startY + 15)
        .text(`Payment Date: ${new Date(receiptData.paymentDate).toLocaleDateString()}`, 50, startY + 30)
        .text(`Academic Year: ${receiptData.academicYear}`, 50, startY + 45);

    const rightColX = 320;
    const student = receiptData.student || {};
    doc.font('Helvetica-Bold').text('Student Details:', rightColX, startY);
    doc.font('Helvetica')
        .text(`Name: ${student.studentName}`, rightColX, startY + 15)
        .text(`Class: ${student.className || 'N/A'} ${student.sectionName || ''}`, rightColX, startY + 30)
        .text(`Roll Number: ${student.rollNumber || 'N/A'}`, rightColX, startY + 45);

    doc.moveDown(2.5);

    // Draw Line Separator
    const sepY = doc.y;
    doc.moveTo(50, sepY).lineTo(545, sepY).strokeColor('#dddddd').stroke();
    doc.moveDown(0.5);

    // 4. Line Items Table Header
    const tableHeaderY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333');
    doc.text('Description', 50, tableHeaderY);
    doc.text('Fee Amount', 280, tableHeaderY, { width: 80, align: 'right' });
    doc.text('Late Fee', 370, tableHeaderY, { width: 80, align: 'right' });
    doc.text('Total Paid', 465, tableHeaderY, { width: 80, align: 'right' });
    doc.moveDown(0.5);

    // Draw Header Separator Line
    const headerSepY = doc.y;
    doc.moveTo(50, headerSepY).lineTo(545, headerSepY).strokeColor('#aaaaaa').stroke();
    doc.moveDown(0.5);

    // 5. Line Items rows
    const items = receiptData.lineItems || [];
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    items.forEach((item) => {
        const itemY = doc.y;
        doc.text(item.description || 'Fee Item', 50, itemY, { width: 220 });
        doc.text(`INR ${Number(item.feeAmount || 0).toFixed(2)}`, 280, itemY, { width: 80, align: 'right' });
        doc.text(item.lateFeeAmount ? `INR ${Number(item.lateFeeAmount).toFixed(2)}` : '—', 370, itemY, { width: 80, align: 'right' });
        doc.text(`INR ${Number(item.lineTotal || 0).toFixed(2)}`, 465, itemY, { width: 80, align: 'right' });
        doc.moveDown(0.8);
    });

    doc.moveDown(1);
    const footerSepY = doc.y;
    doc.moveTo(50, footerSepY).lineTo(545, footerSepY).strokeColor('#dddddd').stroke();
    doc.moveDown(0.5);

    // 6. Summary Block
    const summaryY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Total Amount Received:', 250, summaryY, { width: 180, align: 'right' });
    doc.text(`INR ${Number(receiptData.totalAmountPaid || 0).toFixed(2)}`, 450, summaryY, { width: 95, align: 'right' });

    doc.font('Helvetica').fontSize(9).fillColor('#555555');
    doc.text('Remaining Balance:', 250, summaryY + 15, { width: 180, align: 'right' });
    doc.text(`INR ${Number(receiptData.balanceRemaining || 0).toFixed(2)}`, 450, summaryY + 15, { width: 95, align: 'right' });

    doc.moveDown(2.5);

    // 7. Payment Mode & Verification footer
    const footerY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('Payment Method Details:', 50, footerY);
    doc.font('Helvetica').fontSize(9).fillColor('#333333')
        .text(`Payment Mode: ${String(receiptData.paymentMode).toUpperCase()}`, 50, footerY + 15)
        .text(`Reference No: ${receiptData.referenceNumber || 'N/A'}`, 50, footerY + 30)
        .text(`Collector: ${receiptData.createdByName || 'School System'}`, 50, footerY + 45);

    // 8. VOID / REFUNDED Notice
    if (receiptData.isVoided) {
        doc.rect(50, footerY + 70, 495, 45).fillColor('#ffdddd').fill();
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#cc0000')
            .text('VOIDED TRANSACTION - REFUND ISSUED', 65, footerY + 78, { align: 'center' });
        if (receiptData.voidReason) {
            doc.font('Helvetica').fontSize(9).fillColor('#333333')
                .text(`Reason: ${receiptData.voidReason}`, 65, footerY + 92, { align: 'center' });
        }
    }

    // 9. Absolute footer notice
    doc.font('Helvetica').fontSize(8).fillColor('#888888').text(
        'This is an official computer-generated receipt. No physical signature is required.',
        50,
        760,
        { align: 'center', width: 495 }
    );

    doc.end();
};

module.exports = {
    generateReceiptPDF
};
