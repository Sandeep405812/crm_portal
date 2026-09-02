import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { challanService } from '../../api/services';
import { exportChallanToPDF } from '../../utils/pdfInvoiceGenerator';
import {
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Phone,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ChallanDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchChallan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await challanService.getChallanById(id);
      if (res.data?.success) {
        setChallan(res.data.data.challan);
      }
    } catch {
      toast.error('Failed to load challan details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChallan();
  }, [fetchChallan]);

  const handleUpdateStatus = async (newStatus) => {
    if (
      newStatus === 'CANCELLED' &&
      !window.confirm('Are you sure you want to cancel this challan? Stock will be restored if previously confirmed.')
    ) {
      return;
    }

    setUpdating(true);
    try {
      const res = await challanService.updateStatus(id, newStatus);
      if (res.data.success) {
        toast.success(`Challan status changed to ${newStatus}`);
        fetchChallan();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!challan) return;
    try {
      toast.loading('Generating invoice PDF...', { id: 'pdf-toast' });
      exportChallanToPDF(challan);
      toast.success('PDF invoice downloaded successfully!', { id: 'pdf-toast' });
    } catch {
      toast.error('Failed to export PDF', { id: 'pdf-toast' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-800">Challan Not Found</h2>
        <Link to="/challans" className="text-xs text-amber-600 font-semibold mt-2 inline-block">
          &larr; Back to challans
        </Link>
      </div>
    );
  }

  const customer = challan.customerSnapshot || challan.customer;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link
            to="/challans"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                {challan.challanNumber}
              </h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  challan.status === 'CONFIRMED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : challan.status === 'DRAFT'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                }`}
              >
                {challan.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued on {new Date(challan.createdAt).toLocaleDateString('en-GB')} by {challan.createdBy?.name || 'Admin'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
            title="Direct Browser Print / Save to PDF"
          >
            <Printer className="w-4 h-4" />
            Print Challan
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          {/* Status Transitions */}
          {challan.status === 'DRAFT' && hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
            <button
              disabled={updating}
              onClick={() => handleUpdateStatus('CONFIRMED')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirm & Deduct Stock
            </button>
          )}

          {challan.status !== 'CANCELLED' && hasRole('ADMIN', 'ACCOUNTS', 'SALES') && (
            <button
              disabled={updating}
              onClick={() => handleUpdateStatus('CANCELLED')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Cancel Challan
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document Style Card (A4 Print Ready) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 print-card">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-wide">
              CRM PORTAL OPERATIONSP.
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              123 Logistics Park, Industrial Corridor, New Delhi - 110001
            </p>
            <p className="text-xs text-slate-500">
              GSTIN: <strong>07AAAAA0000A1Z5</strong> | Phone: +91 98765 43210
            </p>
          </div>

          <div className="sm:text-right">
            <span className="inline-block px-3 py-1 bg-amber-600 text-white text-xs font-bold uppercase rounded-md tracking-wider">
              Sales Challan
            </span>
            <div className="text-xs text-slate-500 mt-2 space-y-0.5">
              <div>Challan No: <strong className="font-mono text-slate-800">{challan.challanNumber}</strong></div>
              <div>Date: <strong className="text-slate-800">{new Date(challan.createdAt).toLocaleDateString('en-GB')}</strong></div>
            </div>
          </div>
        </div>

        {/* Bill To Customer Information Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Consignee / Customer Details (Snapshot)
            </span>
            <div className="font-bold text-sm text-slate-900">{customer?.businessName}</div>
            <div className="text-xs text-slate-600">Attn: {customer?.name}</div>
            <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{customer?.mobile}</span>
            </div>
            {customer?.gstNumber && (
              <div className="text-xs text-slate-600 font-mono mt-0.5">
                GSTIN: <strong>{customer?.gstNumber}</strong>
              </div>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Shipping & Delivery Location
            </span>
            <div className="text-xs text-slate-700 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{customer?.address || 'Standard Delivery Location'}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Customer Account Type: <strong className="uppercase">{customer?.type}</strong>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Dispatched Items & Pricing Breakdown
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4">Product Description</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-center">Quantity</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challan.items?.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.sku}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.productName}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      ₹{Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
          <div className="text-xs text-slate-500 max-w-sm">
            {challan.notes ? (
              <div>
                <strong className="text-slate-700 block mb-1">Challan Notes:</strong>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                  {challan.notes}
                </p>
              </div>
            ) : (
              <span className="text-slate-400 italic">No additional notes specified</span>
            )}
          </div>

          <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Total Quantity:</span>
              <strong className="text-slate-900">{challan.totalQuantity} Units</strong>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex justify-between text-sm">
              <span className="font-bold text-slate-800">Grand Total:</span>
              <span className="font-black text-slate-900 font-mono text-base">
                ₹{Number(challan.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
          <div className="pt-8 border-t border-dashed border-slate-300">
            Receiver's Signature & Company Stamp
          </div>
          <div className="pt-8 border-t border-dashed border-slate-300">
            Authorized Signatory / Warehouse Dispatcher
          </div>
        </div>
      </div>
    </div>
  );
}
