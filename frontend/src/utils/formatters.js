/**
 * Formatting & Display Utilities
 * Provides human-friendly helpers for currency, dates, and status styling.
 */

// Format INR currency: e.g. ₹1,45,000.00
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

// Format standard date: 15 Sep 2026
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Format timestamp with time: 15 Sep 2026, 04:30 PM
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Get Badge colors based on status
export const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'IN':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'LEAD':
    case 'DRAFT':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'INACTIVE':
    case 'CANCELLED':
    case 'OUT':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};
