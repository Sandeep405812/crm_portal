/**
 * CSV Export Utility
 * Converts JSON records to standard RFC-4180 CSV formatted stream.
 */

const exportToCsv = (res, filename, columns, rows) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

  // Write header row
  const header = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
  res.write(`${header}\r\n`);

  // Write data rows
  rows.forEach((row) => {
    const line = columns
      .map((col) => {
        let val = typeof col.value === 'function' ? col.value(row) : row[col.key];
        if (val === null || val === undefined) val = '';
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
    res.write(`${line}\r\n`);
  });

  res.end();
};

module.exports = {
  exportToCsv,
};
