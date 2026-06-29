const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
    async generateInvoicePDF(invoice) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 50
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Header
                this.addHeader(doc, invoice);
                
                // Customer Details
                this.addCustomerDetails(doc, invoice);
                
                // Invoice Items Table
                this.addInvoiceItems(doc, invoice);
                
                // Totals
                this.addTotals(doc, invoice);
                
                // Terms & Conditions
                this.addTerms(doc, invoice);
                
                // Footer
                this.addFooter(doc);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    addHeader(doc, invoice) {
        // Company Logo/Name
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text(invoice.company?.name || 'SmartERP', { align: 'center' })
           .fontSize(10)
           .font('Helvetica')
           .text(invoice.company?.address || '', { align: 'center' })
           .text(`GST: ${invoice.company?.gst_number || 'N/A'} | Phone: ${invoice.company?.mobile || 'N/A'}`, { align: 'center' })
           .moveDown();

        // Invoice Title
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('TAX INVOICE', { align: 'center' })
           .moveDown();

        // Invoice Details
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Invoice No: ${invoice.invoice_number}`, { align: 'left' })
           .text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, { align: 'left' })
           .text(`Status: ${invoice.status}`, { align: 'left' })
           .moveDown();
    }

    addCustomerDetails(doc, invoice) {
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Bill To:', { align: 'left' })
           .font('Helvetica')
           .text(invoice.customers?.name || 'N/A')
           .text(invoice.customers?.address || '')
           .text(`GST: ${invoice.customers?.gst_number || 'N/A'}`)
           .text(`Phone: ${invoice.customers?.mobile || 'N/A'}`)
           .text(`Email: ${invoice.customers?.email || 'N/A'}`)
           .moveDown();
    }

    addInvoiceItems(doc, invoice) {
        const tableTop = doc.y;
        const colPositions = {
            item: 50,
            qty: 280,
            rate: 350,
            gst: 400,
            amount: 450
        };

        // Table Header
        doc.font('Helvetica-Bold')
           .text('Item', colPositions.item, tableTop)
           .text('Qty', colPositions.qty, tableTop)
           .text('Rate', colPositions.rate, tableTop)
           .text('GST', colPositions.gst, tableTop)
           .text('Amount', colPositions.amount, tableTop);

        // Line
        doc.moveTo(50, doc.y + 5)
           .lineTo(550, doc.y + 5)
           .stroke();

        // Table Items
        let y = doc.y + 10;
        doc.font('Helvetica');

        for (const item of invoice.invoice_items || []) {
            doc.text(item.stock_items?.name || 'Unknown', colPositions.item, y)
               .text(item.quantity.toString(), colPositions.qty, y)
               .text(`₹${item.rate.toFixed(2)}`, colPositions.rate, y)
               .text(`${item.gst_percentage}%`, colPositions.gst, y)
               .text(`₹${item.total_amount.toFixed(2)}`, colPositions.amount, y);
            y += 20;
        }

        doc.moveDown();
    }

    addTotals(doc, invoice) {
        const totalY = doc.y;
        doc.font('Helvetica-Bold')
           .text('Sub Total:', 400, totalY)
           .text(`₹${invoice.total_amount?.toFixed(2) || '0.00'}`, 480, totalY, { align: 'right' });

        if (invoice.gst_amount > 0) {
            doc.text('GST:', 400, totalY + 20)
               .text(`₹${invoice.gst_amount?.toFixed(2) || '0.00'}`, 480, totalY + 20, { align: 'right' });
        }

        if (invoice.discount_amount > 0) {
            doc.text('Discount:', 400, totalY + 40)
               .text(`-₹${invoice.discount_amount?.toFixed(2) || '0.00'}`, 480, totalY + 40, { align: 'right' });
        }

        doc.fontSize(12)
           .text('Total:', 400, totalY + 60)
           .text(`₹${invoice.net_amount?.toFixed(2) || '0.00'}`, 480, totalY + 60, { align: 'right' });
    }

    addTerms(doc, invoice) {
        doc.moveDown(2);
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('Terms & Conditions:')
           .font('Helvetica')
           .fontSize(9)
           .text(invoice.terms_conditions || '1. Goods once sold will not be taken back.\n2. Payment due within 30 days.\n3. E&OE');
    }

    addFooter(doc) {
        doc.moveDown();
        doc.fontSize(8)
           .text('Generated by SmartERP', 50, doc.page.height - 50, { align: 'center' })
           .text(`Printed on: ${new Date().toLocaleString()}`, 50, doc.page.height - 35, { align: 'center' });
    }
}

module.exports = new PDFGenerator();