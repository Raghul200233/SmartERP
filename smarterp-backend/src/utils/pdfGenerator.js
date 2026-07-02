const PDFDocument = require('pdfkit');

class PDFGenerator {
    async generateInvoice(voucher, companyDetails) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 40,
                    layout: 'portrait'
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Generate the invoice
                this.generateInvoiceContent(doc, voucher, companyDetails);
                doc.end();

            } catch (error) {
                reject(error);
            }
        });
    }

    generateInvoiceContent(doc, voucher, company) {
        // Set font
        doc.font('Helvetica');

        // ============================================
        // HEADER SECTION
        // ============================================
        let y = 50;

        // Company Name
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(company?.name || 'SmartERP', 40, y, { align: 'center' });
        y += 20;

        // Company Address
        doc.fontSize(9)
           .font('Helvetica')
           .text(company?.address || '', 40, y, { align: 'center' });
        y += 14;

        // GST and Contact
        doc.text(`GSTIN/UIN: ${company?.gst_number || 'N/A'}`, 40, y, { align: 'center' });
        y += 14;
        doc.text(`Phone: ${company?.mobile || 'N/A'}`, 40, y, { align: 'center' });
        y += 14;
        doc.text(`State Name: ${company?.state || 'Karnataka'}, Code: 29`, 40, y, { align: 'center' });
        y += 25;

        // ============================================
        // INVOICE TITLE & e-INVOICE
        // ============================================
        // e-Invoice Badge
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .fillColor('#1a56db')
           .text('e-Invoice', 40, y, { align: 'left' });
        
        // IRN
        doc.fillColor('#333333')
           .fontSize(8)
           .text(`IRN: ${this.generateIRN()}`, 40, y + 12, { align: 'left' });
        
        // Ack No & Date (right aligned)
        doc.fontSize(8)
           .text(`Ack No.: ${this.generateAckNo()}`, 40, y, { align: 'right' });
        doc.text(`Ack Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`, 40, y + 12, { align: 'right' });

        y += 45;

        // ============================================
        // INVOICE DETAILS TABLE
        // ============================================
        const tableX = 40;
        const tableWidth = doc.page.width - 80;
        const rowHeight = 18;

        // Header row
        this.drawTableRow(doc, tableX, y, tableWidth, rowHeight, [
            { text: 'Invoice No.', align: 'left', bold: true },
            { text: 'Dated', align: 'center', bold: true },
            { text: 'Delivery Note', align: 'center', bold: true },
            { text: 'Mode/Terms of Payment', align: 'right', bold: true }
        ], '#f3f4f6');

        y += rowHeight;

        // Values row
        this.drawTableRow(doc, tableX, y, tableWidth, rowHeight, [
            { text: voucher.voucher_number || 'INV-001', align: 'left' },
            { text: new Date(voucher.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }), align: 'center' },
            { text: '-', align: 'center' },
            { text: voucher.payment_type || 'CASH', align: 'right' }
        ]);

        y += rowHeight + 4;

        // Second row - References
        this.drawTableRow(doc, tableX, y, tableWidth, rowHeight, [
            { text: 'Reference No. & Date', align: 'left', bold: true },
            { text: 'Other References', align: 'center', bold: true },
            { text: '', align: 'center' },
            { text: '', align: 'right' }
        ], '#f3f4f6');

        y += rowHeight;

        this.drawTableRow(doc, tableX, y, tableWidth, rowHeight, [
            { text: voucher.reference_number || '-', align: 'left' },
            { text: '-', align: 'center' },
            { text: '', align: 'center' },
            { text: '', align: 'right' }
        ]);

        y += rowHeight + 10;

        // ============================================
        // CONSIGNEE AND BUYER
        // ============================================
        const colWidth = (tableWidth - 4) / 3;

        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Consignee (Ship to)', tableX, y);
        y += 14;

        const customerName = voucher.customers?.name || 'Walk-in Customer';
        doc.fontSize(8)
           .font('Helvetica')
           .text(customerName, tableX, y);
        y += 12;
        doc.text(voucher.customers?.address || 'N/A', tableX, y);
        y += 12;
        doc.text(`GSTIN/UIN: ${voucher.customers?.gst_number || 'N/A'}`, tableX, y);
        y += 12;
        doc.text(`State Name: Karnataka, Code: 29`, tableX, y);
        y += 25;

        // Buyer (Bill to) - Right side
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Buyer (Bill to)', tableX + colWidth, y - 65);
        doc.fontSize(8)
           .font('Helvetica')
           .text(customerName, tableX + colWidth, y - 50);
        doc.text(voucher.customers?.address || 'N/A', tableX + colWidth, y - 38);
        doc.text(`GSTIN/UIN: ${voucher.customers?.gst_number || 'N/A'}`, tableX + colWidth, y - 26);
        doc.text(`State Name: Karnataka, Code: 29`, tableX + colWidth, y - 14);

        y += 50;

        // ============================================
        // ITEMS TABLE
        // ============================================
        this.drawItemsTable(doc, voucher, tableX, y, tableWidth);
        y += 120 + (voucher.inventory_transactions?.length || 0) * 20;

        // ============================================
        // AMOUNT IN WORDS
        // ============================================
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Amount Chargeable (in words)', tableX, y);
        y += 14;
        doc.fontSize(9)
           .font('Helvetica')
           .text(`Indian Rupee ${this.numberToWords(voucher.amount || 0)} Only`, tableX, y);
        y += 25;

        // ============================================
        // TAX SUMMARY TABLE
        // ============================================
        this.drawTaxSummary(doc, voucher, tableX, y, tableWidth);
        y += 70;

        // ============================================
        // TAX AMOUNT IN WORDS
        // ============================================
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Tax Amount (in words)', tableX, y);
        y += 14;
        const gstAmount = voucher.gst_amount || 0;
        doc.fontSize(9)
           .font('Helvetica')
           .text(`Indian Rupee ${this.numberToWords(gstAmount)} Only`, tableX, y);
        y += 30;

        // ============================================
        // DECLARATION
        // ============================================
        doc.fontSize(8)
           .font('Helvetica')
           .text('Declaration', tableX, y, { underline: true });
        y += 12;
        doc.text('We declare that this invoice shows the actual price of the goods described', tableX, y);
        y += 12;
        doc.text('and that all particulars are true and correct.', tableX, y);
        y += 25;

        // ============================================
        // AUTHORISED SIGNATORY
        // ============================================
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text(`for ${company?.name || 'SmartERP'}`, tableX + tableWidth - 180, y);
        y += 20;
        doc.text('Authorised Signatory', tableX + tableWidth - 180, y);
        y += 30;

        // ============================================
        // FOOTER
        // ============================================
        doc.fontSize(7)
           .font('Helvetica')
           .fillColor('#666666')
           .text('This is a Computer Generated Invoice', 40, doc.page.height - 50, { align: 'center' });
    }

    drawTableRow(doc, x, y, width, height, columns, bgColor = null) {
        const colWidth = width / columns.length;
        
        if (bgColor) {
            doc.fillColor(bgColor)
               .rect(x, y, width, height)
               .fill()
               .fillColor('#000000');
        }

        let currentX = x;
        columns.forEach((col, index) => {
            doc.fontSize(8)
               .font(col.bold ? 'Helvetica-Bold' : 'Helvetica')
               .text(col.text, currentX + 4, y + 3, {
                   width: colWidth - 8,
                   align: col.align || 'left',
                   ellipsis: true
               });
            currentX += colWidth;
        });

        doc.rect(x, y, width, height).stroke();
    }

    drawItemsTable(doc, voucher, x, y, width) {
        const colWidths = [30, 180, 60, 50, 60, 40, 40, 70];
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const startX = x + (width - totalWidth) / 2;
        let currentY = y;

        // Table Header
        const headers = ['SI No.', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate', 'per', 'Disc. %', 'Amount'];
        doc.fontSize(7)
           .font('Helvetica-Bold');

        let currentX = startX;
        headers.forEach((header, index) => {
            doc.text(header, currentX + 2, currentY + 2, {
                width: colWidths[index] - 4,
                align: index === 0 ? 'center' : 'left'
            });
            currentX += colWidths[index];
        });

        doc.rect(startX, currentY, totalWidth, 14).stroke();
        currentY += 14;

        // Items
        const items = voucher.inventory_transactions || [];
        doc.fontSize(7)
           .font('Helvetica');

        items.forEach((item, index) => {
            currentX = startX;
            const rowData = [
                (index + 1).toString(),
                item.stock_items?.name || 'Unknown',
                '1005',
                item.quantity?.toString() || '0',
                item.rate?.toFixed(2) || '0.00',
                'No',
                '0',
                item.value?.toFixed(2) || '0.00'
            ];

            rowData.forEach((data, colIndex) => {
                doc.text(data, currentX + 2, currentY + 2, {
                    width: colWidths[colIndex] - 4,
                    align: colIndex === 0 ? 'center' : 'left'
                });
                currentX += colWidths[colIndex];
            });

            doc.rect(startX, currentY, totalWidth, 14).stroke();
            currentY += 14;
        });

        // Total Row
        const totalAmount = items.reduce((sum, i) => sum + (i.value || 0), 0);
        const grandTotal = voucher.amount || 0;

        currentX = startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] + colWidths[6];
        doc.font('Helvetica-Bold')
           .text(grandTotal.toFixed(2), currentX + 2, currentY + 2, {
               width: colWidths[7] - 4,
               align: 'right'
           });
        doc.rect(startX, currentY, totalWidth, 14).stroke();

        // GST Breakup
        currentY += 14;
        doc.font('Helvetica')
           .fontSize(6);
        
        const gstAmount = voucher.gst_amount || 0;
        const cgst = (gstAmount / 2);
        const sgst = (gstAmount / 2);
        
        doc.text('CGST', startX + 400, currentY + 2);
        doc.text(sgst.toFixed(2), startX + 470, currentY + 2);
        currentY += 12;
        doc.text('SGST', startX + 400, currentY + 2);
        doc.text(sgst.toFixed(2), startX + 470, currentY + 2);
        currentY += 12;
        doc.font('Helvetica-Bold')
           .text('Total', startX + 400, currentY + 2);
        doc.text(gstAmount.toFixed(2), startX + 470, currentY + 2);
    }

    drawTaxSummary(doc, voucher, x, y, width) {
        const colWidths = [100, 100, 100, 100, 100];
        const totalWidth = colWidths.reduce((a, b) => a + b, 0);
        const startX = x + (width - totalWidth) / 2;
        let currentY = y;

        const headers = ['HSN/SAC', 'Taxable Value', 'Central Tax', 'State Tax', 'Total Tax Amount'];
        doc.fontSize(7)
           .font('Helvetica-Bold');

        let currentX = startX;
        headers.forEach((header, index) => {
            doc.text(header, currentX + 2, currentY + 2, {
                width: colWidths[index] - 4,
                align: index === 0 ? 'left' : 'center'
            });
            currentX += colWidths[index];
        });

        doc.rect(startX, currentY, totalWidth, 14).stroke();
        currentY += 14;

        const items = voucher.inventory_transactions || [];
        const totalAmount = items.reduce((sum, i) => sum + (i.value || 0), 0);
        const gstAmount = voucher.gst_amount || 0;
        const cgst = (gstAmount / 2);
        const sgst = (gstAmount / 2);

        doc.fontSize(7)
           .font('Helvetica');

        doc.text('1005', startX + 2, currentY + 2, { width: colWidths[0] - 4 });
        doc.text(totalAmount.toFixed(2), startX + colWidths[0] + 2, currentY + 2, { width: colWidths[1] - 4, align: 'center' });
        doc.text('9%', startX + colWidths[0] + colWidths[1] + 2, currentY + 2, { width: colWidths[2] - 4, align: 'center' });
        doc.text(cgst.toFixed(2), startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, currentY + 2, { width: colWidths[3] - 4, align: 'center' });
        doc.text(sgst.toFixed(2), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, currentY + 2, { width: colWidths[4] - 4, align: 'center' });

        doc.rect(startX, currentY, totalWidth, 14).stroke();
        currentY += 14;

        // Total Row
        doc.font('Helvetica-Bold');
        doc.text('Total', startX + 2, currentY + 2, { width: colWidths[0] - 4 });
        doc.text(totalAmount.toFixed(2), startX + colWidths[0] + 2, currentY + 2, { width: colWidths[1] - 4, align: 'center' });
        doc.text('', startX + colWidths[0] + colWidths[1] + 2, currentY + 2);
        doc.text(cgst.toFixed(2), startX + colWidths[0] + colWidths[1] + colWidths[2] + 2, currentY + 2, { width: colWidths[3] - 4, align: 'center' });
        doc.text(sgst.toFixed(2), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, currentY + 2, { width: colWidths[4] - 4, align: 'center' });

        doc.rect(startX, currentY, totalWidth, 14).stroke();
    }

    generateIRN() {
        const chars = 'abcdef0123456789';
        let irn = '';
        for (let i = 0; i < 32; i++) {
            irn += chars[Math.floor(Math.random() * chars.length)];
        }
        return irn;
    }

    generateAckNo() {
        return '1120100' + Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
    }

    numberToWords(num) {
        if (num === 0) return 'Zero';
        const numStr = num.toString();
        const parts = numStr.split('.');
        const rupees = parseInt(parts[0]) || 0;
        const paise = parts[1] ? parseInt(parts[1]) : 0;
        
        let words = '';
        if (rupees > 0) {
            words = this.convertNumberToWords(rupees);
        }
        if (paise > 0) {
            words += ` and ${this.convertNumberToWords(paise)} Paise`;
        }
        return words || 'Zero';
    }

    convertNumberToWords(num) {
        if (num === 0) return 'Zero';
        
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const ten = Math.floor(num / 10);
            const one = num % 10;
            return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
        }
        if (num < 1000) {
            const hundred = Math.floor(num / 100);
            const rest = num % 100;
            return ones[hundred] + ' Hundred' + (rest > 0 ? ' and ' + this.convertNumberToWords(rest) : '');
        }
        if (num < 100000) {
            const thousand = Math.floor(num / 1000);
            const rest = num % 1000;
            return this.convertNumberToWords(thousand) + ' Thousand' + (rest > 0 ? ' ' + this.convertNumberToWords(rest) : '');
        }
        if (num < 10000000) {
            const lakh = Math.floor(num / 100000);
            const rest = num % 100000;
            return this.convertNumberToWords(lakh) + ' Lakh' + (rest > 0 ? ' ' + this.convertNumberToWords(rest) : '');
        }
        if (num < 1000000000) {
            const crore = Math.floor(num / 10000000);
            const rest = num % 10000000;
            return this.convertNumberToWords(crore) + ' Crore' + (rest > 0 ? ' ' + this.convertNumberToWords(rest) : '');
        }
        return num.toString();
    }
}

module.exports = new PDFGenerator();