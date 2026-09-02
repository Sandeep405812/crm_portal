import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerService } from '../../api/services';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Plus,
  ArrowLeft,
  FileText,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function CustomerDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Follow up form state
  const [followUpNote, setFollowUpNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomerById(id);
      if (res.data?.success) {
        setCustomer(res.data.data.customer);
      }
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpNote.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await customerService.addFollowUp(id, {
        note: followUpNote,
        followUpDate: nextFollowUpDate || null,
      });
      if (res.data.success) {
        toast.success('Follow-up note added');
        setFollowUpNote('');
        setNextFollowUpDate('');
        fetchCustomer();
      }
    } catch {
      toast.error('Failed to add follow-up note');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h2 className="text-base font-bold text-slate-800">Customer Not Found</h2>
        <Link to="/customers" className="text-xs text-amber-600 font-semibold mt-2 inline-block">
          &larr; Back to customer list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {customer.businessName}
            </h1>
            <p className="text-xs text-slate-500">
              Customer ID: <span className="font-mono text-slate-600">{customer.id}</span>
            </p>
          </div>
        </div>

        {hasRole('ADMIN', 'SALES') && (
          <Link
            to={`/challans/new?customerId=${customer.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Sales Challan
          </Link>
        )}
      </div>

      {/* Customer Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Profile Summary
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
              {customer.type}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Primary Contact Person</span>
              <span className="font-semibold text-slate-800 text-sm">{customer.name}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{customer.mobile}</span>
            </div>

            {customer.email && (
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{customer.email}</span>
              </div>
            )}

            {customer.gstNumber && (
              <div>
                <span className="text-slate-400 block text-[11px]">GSTIN</span>
                <span className="font-mono font-semibold text-slate-800">{customer.gstNumber}</span>
              </div>
            )}

            {customer.address && (
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{customer.address}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[11px]">Status</span>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                {customer.status}
              </span>
            </div>

            {customer.followUpDate && (
              <div>
                <span className="text-slate-400 block text-[11px]">Scheduled Follow-Up</span>
                <span className="font-semibold text-amber-700 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(customer.followUpDate).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: CRM Follow-Up Timeline & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Follow-Up Note Card */}
          {hasRole('ADMIN', 'SALES') && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                Add New Follow-up Note
              </h3>

              <form onSubmit={handleAddFollowUp} className="space-y-3">
                <textarea
                  required
                  rows="3"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Record customer discussion, requirements, next action items..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Next Follow-up Date:</span>
                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) => setNextFollowUpDate(e.target.value)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingNote}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    {submittingNote ? 'Saving...' : 'Post Follow-up Note'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Follow-up Notes Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Follow-Up Activity Timeline
            </h3>

            {customer.followUps?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No follow-up notes recorded yet for this customer.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {customer.followUps.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Timeline bullet */}
                    <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-amber-600 border-2 border-white shadow-xs" />

                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-bold text-slate-700">
                          {item.createdBy?.name || 'Sales Rep'}
                        </span>
                        <span>
                          {new Date(item.createdAt).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 whitespace-pre-wrap">{item.note}</p>

                      {item.followUpDate && (
                        <div className="mt-2 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Follow-up Scheduled:{' '}
                          {new Date(item.followUpDate).toLocaleDateString('en-GB')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Sales Challans */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Past Sales Challans ({customer.challans?.length || 0})
            </h3>

            {customer.challans?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No challans generated yet for this customer.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {customer.challans.map((ch) => (
                  <div
                    key={ch.id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{ch.challanNumber}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ch.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ch.status === 'DRAFT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ch.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ch.totalQuantity} items • Created by {ch.createdBy?.name || 'User'} on{' '}
                        {new Date(ch.createdAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">
                          ₹{Number(ch.totalAmount).toFixed(2)}
                        </div>
                      </div>
                      <Link
                        to={`/challans/${ch.id}`}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="View Challan"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
