const PDFDocument = require('pdfkit');

const generateChallanPDF = (challan, stream) => {
  // A4 size is 595.28 x 841.89 points
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  doc.pipe(stream);

  // Safe parse customer data
  let customer = challan.customerSnapshot;
  if (typeof customer === 'string') {
    try {
      customer = JSON.parse(customer);
    } catch (e) {
      customer = challan.customer || {};
    }
  } else if (!customer) {
    customer = challan.customer || {};
  }

  // 1. Company Brand Header
  doc
    .fillColor('#0F172A')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('CRM PORTAL OPERATIONS CORP.', 40, 40)
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748B')
    .text('123 Logistics Park, Industrial Corridor, New Delhi - 110001', 40, 62)
    .text('Email: operations@crmportal.com | Phone: +91 98765 43210 | GSTIN: 07AAAAA0000A1Z5', 40, 75);

  // 2. Document Badge
  doc
    .roundedRect(420, 38, 135, 28, 4)
    .fill('#D97706'); // Saffron Amber
  doc
    .fillColor('#FFFFFF')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('SALES CHALLAN', 432, 46);

  // Divider Line
  doc
    .strokeColor('#E2E8F0')
    .lineWidth(1)
    .moveTo(40, 95)
    .lineTo(555, 95)
    .stroke();

  // 3. Information Section (Two Columns)
  const infoTop = 108;

  // Left Column: Consignee Details Box
  doc
    .roundedRect(40, infoTop, 250, 95, 4)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  doc
    .fillColor('#475569')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('BILL / SHIP TO (CONSIGNEE):', 50, infoTop + 10)
    .fillColor('#0F172A')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(customer.businessName || customer.name || 'Walk-in Client', 50, infoTop + 24)
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#334155')
    .text(`Attn: ${customer.name || 'Authorized Buyer'}`, 50, infoTop + 38)
    .text(`Mobile: ${customer.mobile || 'N/A'}`, 50, infoTop + 50)
    .text(`GSTIN: ${customer.gstNumber || 'Unregistered'}`, 50, infoTop + 62)
    .text(`Address: ${customer.address || 'Standard Warehouse Delivery'}`, 50, infoTop + 74, { width: 230, height: 20 });

  // Right Column: Challan Metadata Box
  doc
    .roundedRect(305, infoTop, 250, 95, 4)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  const createdDate = challan.createdAt ? new Date(challan.createdAt).toLocaleDateString('en-GB') : 'N/A';
  const createdBy = challan.createdBy?.name || 'System Admin';

  doc
    .fillColor('#475569')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('DOCUMENT DETAILS:', 315, infoTop + 10)
    .fillColor('#334155')
    .fontSize(8.5)
    .font('Helvetica')
    .text('Challan No:', 315, infoTop + 26)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text(challan.challanNumber || 'N/A', 380, infoTop + 26)
    .font('Helvetica')
    .fillColor('#334155')
    .text('Issue Date:', 315, infoTop + 40)
    .text(createdDate, 380, infoTop + 40)
    .text('Status:', 315, infoTop + 54)
    .font('Helvetica-Bold')
    .fillColor(challan.status === 'CONFIRMED' ? '#16A34A' : '#2563EB')
    .text(challan.status || 'DRAFT', 380, infoTop + 54)
    .font('Helvetica')
    .fillColor('#334155')
    .text('Issued By:', 315, infoTop + 68)
    .text(createdBy, 380, infoTop + 68);

  // 4. Line Items Table
  const tableTop = 220;

  // Table Header Background
  doc
    .rect(40, tableTop, 515, 22)
    .fill('#F1F5F9');

  doc
    .fillColor('#1E293B')
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text('#', 48, tableTop + 6)
    .text('SKU', 75, tableTop + 6)
    .text('Product Description', 160, tableTop + 6)
    .text('Unit Price (INR)', 340, tableTop + 6, { width: 75, align: 'right' })
    .text('Qty', 425, tableTop + 6, { width: 35, align: 'right' })
    .text('Subtotal (INR)', 470, tableTop + 6, { width: 75, align: 'right' });

  // Render Item Rows
  let currentY = tableTop + 24;
  const items = challan.items || [];

  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.rect(40, currentY - 2, 515, 20).fill('#FAFAFA');
    }

    const unitPrice = Number(item.unitPrice || 0).toFixed(2);
    const subtotal = Number(item.subtotal || 0).toFixed(2);

    doc
      .fillColor('#334155')
      .fontSize(8.5)
      .font('Helvetica')
      .text(`${index + 1}`, 48, currentY + 3)
      .font('Helvetica-Bold')
      .text(item.sku || 'N/A', 75, currentY + 3)
      .font('Helvetica')
      .text(item.productName || 'Product', 160, currentY + 3, { width: 170 })
      .text(`₹${unitPrice}`, 340, currentY + 3, { width: 75, align: 'right' })
      .font('Helvetica-Bold')
      .text(`${item.quantity}`, 425, currentY + 3, { width: 35, align: 'right' })
      .text(`₹${subtotal}`, 470, currentY + 3, { width: 75, align: 'right' });

    currentY += 20;
  });

  // Table Bottom Line
  doc
    .strokeColor('#CBD5E1')
    .lineWidth(1)
    .moveTo(40, currentY + 5)
    .lineTo(555, currentY + 5)
    .stroke();

  // 5. Grand Totals Summary Box
  const summaryY = currentY + 15;
  doc
    .roundedRect(340, summaryY, 215, 55, 4)
    .fillAndStroke('#F8FAFC', '#E2E8F0');

  doc
    .fillColor('#475569')
    .fontSize(9)
    .font('Helvetica')
    .text('Total Dispatch Qty:', 350, summaryY + 10)
    .font('Helvetica-Bold')
    .text(`${challan.totalQuantity} Units`, 460, summaryY + 10, { width: 85, align: 'right' })
    .font('Helvetica')
    .text('Grand Total:', 350, summaryY + 30)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0F172A')
    .text(`₹${Number(challan.totalAmount || 0).toFixed(2)}`, 440, summaryY + 28, { width: 105, align: 'right' });

  // 6. Notes
  if (challan.notes) {
    doc
      .fillColor('#64748B')
      .fontSize(8.5)
      .font('Helvetica-Oblique')
      .text(`Notes / Instructions: ${challan.notes}`, 40, summaryY + 10, { width: 280 });
  }

  // 7. Signature Declarations
  const footerY = 720;
  doc
    .strokeColor('#CBD5E1')
    .lineWidth(1)
    .moveTo(40, footerY)
    .lineTo(190, footerY)
    .stroke()
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#64748B')
    .text("Receiver's Signature & Company Stamp", 40, footerY + 6)

    .moveTo(405, footerY)
    .lineTo(555, footerY)
    .stroke()
    .text('Authorized Signatory / Warehouse Dispatcher', 370, footerY + 6, { align: 'right' });

  doc.end();
};

module.exports = {
  generateChallanPDF,
};
