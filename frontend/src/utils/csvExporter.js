/**
 * Client-side CSV Exporter Utility
 * Converts Javascript objects into RFC-4180 compliant CSV and triggers browser download.
 */

export const downloadCSV = (data, columns, filename) => {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  // Header row
  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Data rows
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val = typeof col.value === 'function' ? col.value(item) : item[col.key];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n'); // \uFEFF for UTF-8 BOM (Excel support)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `${filename}_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
