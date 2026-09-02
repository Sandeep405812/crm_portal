import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../api/services';
import { downloadCSV } from '../../utils/csvExporter';
import {
  Boxes,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  User,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockMovementLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getStockLogs({
        search,
        movementType: movementFilter,
        page,
        limit: 15,
      });
      if (res.data?.success) {
        setLogs(res.data.data.logs);
        setPagination(res.data.data.pagination);
      }
    } catch {
      toast.error('Failed to load stock logs');
    } finally {
      setLoading(false);
    }
  }, [search, movementFilter, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (!logs.length) {
      toast.error('No stock movement logs to export');
      return;
    }

    const columns = [
      {
        label: 'Timestamp',
        value: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString('en-GB') : ''),
      },
      { label: 'Product Name', value: (row) => row.product?.name },
      { label: 'SKU', value: (row) => row.product?.sku },
      { label: 'Movement Type', key: 'movementType' },
      { label: 'Quantity Changed', key: 'quantity' },
      { label: 'Reason / Reference', key: 'reason' },
      { label: 'Logged By', value: (row) => row.createdBy?.name || 'System' },
    ];

    downloadCSV(logs, columns, 'Stock_Movement_Ledger');
    toast.success('Stock ledger exported as CSV');
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-600" />
            Stock Movement Logs & Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of every stock IN / OUT movement with timestamp and authorized employee
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-xs self-start sm:self-auto"
          title="Export to CSV / Excel"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Export CSV
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or reason..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={movementFilter}
            onChange={(e) => {
              setMovementFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
          >
            <option value="">All Movement Types</option>
            <option value="IN">Stock IN (+)</option>
            <option value="OUT">Stock OUT (-)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Quantity Changed</th>
                <th className="py-3 px-4">Reason / Reference</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No stock movement logs recorded
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-GB', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{log.product?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {log.product?.sku}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          log.movementType === 'IN'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {log.movementType === 'IN' ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-600" />
                        )}
                        {log.movementType}
                      </span>
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right font-black text-sm ${
                        log.movementType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {log.movementType === 'IN' ? '+' : '-'}
                      {log.quantity}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {log.reason}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.createdBy?.name || 'System Admin'}</span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          ({log.createdBy?.role || 'ADMIN'})
                        </span>
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
