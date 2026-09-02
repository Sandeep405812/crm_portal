import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportChallanToPDF = (challan) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Safe parse customer data
  let customer = challan.customerSnapshot;
  if (typeof customer === 'string') {
    try {
      customer = JSON.parse(customer);
    } catch {
      customer = challan.customer || {};
    }
  } else if (!customer) {
    customer = challan.customer || {};
  }

  // Header - Company Info
  doc.setFillColor(15, 23, 42); // slate-900
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CRM PORTAL OPERATIONS CORP.', 14, 20);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('123 Logistics Park, Industrial Corridor, New Delhi - 110001', 14, 26);
  doc.text('Email: operations@crmportal.com | Phone: +91 98765 43210 | GSTIN: 07AAAAA0000A1Z5', 14, 31);

  // Document Title Badge
  doc.setFillColor(217, 119, 6); // amber-600 (saffron)
  doc.roundedRect(145, 14, 51, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES CHALLAN', 151, 20.5);

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  // Customer & Challan Metadata Boxes
  const topY = 42;

  // Left Box: Consignee
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, topY, 88, 38, 2, 2, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL / SHIP TO (CONSIGNEE):', 18, topY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(customer.businessName || customer.name || 'Walk-in Client', 18, topY + 12);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Attn: ${customer.name || 'Authorized Representative'}`, 18, topY + 17);
  doc.text(`Mobile: ${customer.mobile || 'N/A'}`, 18, topY + 22);
  doc.text(`GSTIN: ${customer.gstNumber || 'Unregistered'}`, 18, topY + 27);
  doc.text(`Address: ${customer.address || 'Standard Delivery'}`, 18, topY + 32, { maxWidth: 80 });

  // Right Box: Challan Details
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, topY, 88, 38, 2, 2, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT DETAILS:', 112, topY + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Challan No:', 112, topY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(challan.challanNumber || 'N/A', 140, topY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Date:', 112, topY + 19);
  const dateStr = challan.createdAt ? new Date(challan.createdAt).toLocaleDateString('en-GB') : 'N/A';
  doc.text(dateStr, 140, topY + 19);

  doc.text('Status:', 112, topY + 25);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(challan.status === 'CONFIRMED' ? 22 : 37, challan.status === 'CONFIRMED' ? 163 : 99, challan.status === 'CONFIRMED' ? 74 : 235);
  doc.text(challan.status || 'DRAFT', 140, topY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Issued By:', 112, topY + 31);
  doc.text(challan.createdBy?.name || 'Admin', 140, topY + 31);

  // Table of Items
  const items = challan.items || [];
  const tableData = items.map((item, idx) => [
    idx + 1,
    item.sku || 'N/A',
    item.productName || 'Product Item',
    `INR ${Number(item.unitPrice || 0).toFixed(2)}`,
    item.quantity,
    `INR ${Number(item.subtotal || 0).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['#', 'SKU', 'Product Description', 'Unit Price', 'Qty', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    styles: {
      cellPadding: 2.5,
    },
  });

  const finalY = (doc).lastAutoTable.finalY + 8;

  // Summary Totals Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, finalY, 76, 22, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Dispatch Qty:', 124, finalY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${challan.totalQuantity} Units`, 190, finalY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Grand Total:', 124, finalY + 16);
  doc.setFontSize(10.5);
  doc.text(`INR ${Number(challan.totalAmount || 0).toFixed(2)}`, 190, finalY + 16, { align: 'right' });

  // Notes
  if (challan.notes) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Notes: ${challan.notes}`, 14, finalY + 7, { maxWidth: 95 });
  }

  // Signatures
  const footerY = 255;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(14, footerY, 65, footerY);
  doc.line(145, footerY, 196, footerY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Receiver's Signature & Stamp", 14, footerY + 5);
  doc.text('Authorized Signatory', 196, footerY + 5, { align: 'right' });

  // Save PDF
  doc.save(`Challan-${challan.challanNumber || 'Doc'}.pdf`);
};
