import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../api/services';
import {
  Users,
  Package,
  FileText,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch {
      // Graceful error fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const { metrics, recentChallans, recentStockLogs } = data || {
    metrics: { customers: {}, inventory: {}, sales: {} },
    recentChallans: [],
    recentStockLogs: [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-xs text-amber-200 mt-1">
            Logged in as <span className="font-bold uppercase text-white bg-amber-600/50 px-2 py-0.5 rounded-md">{user?.role}</span>. Here is the operational summary of your distribution business.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <Link
              to="/challans/new"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              New Challan
            </Link>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <Link
              to="/customers"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-all"
            >
              <Users className="w-4 h-4" />
              Add Customer
            </Link>
          )}
        </div>
      </div>

      {/* Low Stock Warning Alert */}
      {metrics?.inventory?.lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900">
              Low Stock Alert ({metrics.inventory.lowStockCount} Products)
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Some items have reached or fallen below the minimum safety threshold.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {metrics.inventory.lowStockItems?.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100/80 text-amber-800 text-xs rounded-md font-medium border border-amber-200"
                >
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-amber-900 font-bold">({item.currentStock} left)</span>
                </span>
              ))}
              <Link
                to="/products?lowStock=true"
                className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1 self-center ml-2"
              >
                View all &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Customers
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.customers?.total || 0}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-bold">{metrics?.customers?.active || 0} Active</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{metrics?.customers?.leads || 0} Leads</span>
          </div>
        </div>

        {/* Total Products & Inventory Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Products
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.inventory?.totalProducts || 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Valuation: <strong className="text-slate-800">₹{Number(metrics?.inventory?.totalValuation || 0).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Sales Challans */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sales Challans
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics?.sales?.totalChallans || 0}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="text-emerald-600 font-bold">{metrics?.sales?.confirmed || 0} Confirmed</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">{metrics?.sales?.draft || 0} Draft</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dispatched Revenue
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{Number(metrics?.sales?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <strong className="text-slate-800">{metrics?.sales?.totalUnitsSold || 0}</strong> Units Dispatched
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Challans & Recent Inventory Movement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Challans */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Recent Sales Challans
            </h2>
            <Link to="/challans" className="text-xs font-semibold text-amber-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentChallans?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No challans created yet</div>
            ) : (
              recentChallans?.map((challan) => (
                <div key={challan.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{challan.challanNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          challan.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : challan.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {challan.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {challan.customer?.businessName || challan.customer?.name}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      ₹{Number(challan.totalAmount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(challan.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movement Logs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Recent Stock Movements
            </h2>
            <Link to="/inventory/logs" className="text-xs font-semibold text-amber-600 hover:underline">
              Full Ledger
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentStockLogs?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No stock logs found</div>
            ) : (
              recentStockLogs?.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        log.movementType === 'IN'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {log.movementType === 'IN' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{log.product?.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                        {log.reason}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-bold ${
                        log.movementType === 'IN' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {log.movementType === 'IN' ? '+' : '-'}
                      {log.quantity} Units
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
