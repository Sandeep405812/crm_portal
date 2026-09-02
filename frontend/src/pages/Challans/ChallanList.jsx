import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { challanService } from '../../api/services';
import { downloadCSV } from '../../utils/csvExporter';
import { exportChallanToPDF } from '../../utils/pdfInvoiceGenerator';
import {
  FileText,
  Search,
  Plus,
  Filter,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ChallanList() {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchChallans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await challanService.getChallans({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      if (res.data?.success) {
        setChallans(res.data.data.challans);
        setPagination(res.data.data.pagination);
      }
    } catch {
      toast.error('Failed to load sales challans');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchChallans();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchChallans]);

  const handleExportCSV = () => {
    if (!challans.length) {
      toast.error('No challans to export');
      return;
    }

    const columns = [
      { label: 'Challan Number', key: 'challanNumber' },
      { label: 'Customer Business', value: (row) => row.customer?.businessName || row.customer?.name },
      { label: 'Customer Name', value: (row) => row.customer?.name },
      { label: 'Status', key: 'status' },
      { label: 'Total Quantity', key: 'totalQuantity' },
      { label: 'Total Amount (INR)', value: (row) => Number(row.totalAmount).toFixed(2) },
      {
        label: 'Date',
        value: (row) => (row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : ''),
      },
    ];

    downloadCSV(challans, columns, 'Sales_Challans_Report');
    toast.success('Sales challans exported as CSV');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 uppercase">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownloadPDF = async (challanId) => {
    try {
      toast.loading('Preparing invoice PDF...', { id: 'pdf-toast' });
      // Fetch full details of challan (with line items)
      const res = await challanService.getChallanById(challanId);
      if (res.data.success) {
        exportChallanToPDF(res.data.data.challan);
        toast.success('PDF invoice downloaded successfully!', { id: 'pdf-toast' });
      }
    } catch {
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Sales Challans & Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, confirm, track stock deductions, and export PDF invoices for wholesale dispatches
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-xs"
            title="Export to CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>

          {hasRole('ADMIN', 'SALES') && (
            <Link
              to="/challans/new"
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Challan
            </Link>
          )}
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by challan #, customer, business..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Status:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Challan Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Challan #</th>
                <th className="py-3 px-4">Customer & Business</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-center">Items Qty</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No sales challans found
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-600">
                      <Link to={`/challans/${ch.id}`} className="hover:underline">
                        {ch.challanNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {ch.customer?.businessName || ch.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{ch.customer?.name}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(ch.createdAt).toLocaleDateString('en-GB')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {ch.totalQuantity} Units
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      ₹{Number(ch.totalAmount).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(ch.status)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(ch.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          title="Download PDF Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/challans/${ch.id}`}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
