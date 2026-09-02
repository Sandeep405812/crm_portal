import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { customerService, productService, challanService } from '../../api/services';
import {
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
  Building2,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChallanCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);

  const [items, setItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0, subtotal: 0, availableStock: 0, sku: '', name: '' },
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [custRes, prodRes] = await Promise.all([
        customerService.getCustomers({ limit: 100 }),
        productService.getProducts({ limit: 100 }),
      ]);

      if (custRes.data?.success) {
        setCustomers(custRes.data.data.customers);
      }
      if (prodRes.data?.success) {
        setProducts(prodRes.data.data.products);
      }
    } catch {
      toast.error('Failed to load customers or products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleProductChange = (index, productId) => {
    const selectedProd = products.find((p) => p.id === productId);
    const newItems = [...items];

    if (selectedProd) {
      const unitPrice = Number(selectedProd.unitPrice);
      const quantity = newItems[index].quantity || 1;
      newItems[index] = {
        productId: selectedProd.id,
        name: selectedProd.name,
        sku: selectedProd.sku,
        unitPrice: unitPrice,
        quantity: quantity,
        subtotal: unitPrice * quantity,
        availableStock: selectedProd.currentStock,
      };
    } else {
      newItems[index] = {
        productId: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0,
        availableStock: 0,
        sku: '',
        name: '',
      };
    }
    setItems(newItems);
  };

  const handleQuantityChange = (index, qty) => {
    const newItems = [...items];
    const quantity = Math.max(1, parseInt(qty || '1', 10));
    newItems[index].quantity = quantity;
    newItems[index].subtotal = (newItems[index].unitPrice || 0) * quantity;
    setItems(newItems);
  };

  const handleUnitPriceChange = (index, price) => {
    const newItems = [...items];
    const unitPrice = Math.max(0, parseFloat(price || '0'));
    newItems[index].unitPrice = unitPrice;
    newItems[index].subtotal = unitPrice * (newItems[index].quantity || 1);
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: '', quantity: 1, unitPrice: 0, subtotal: 0, availableStock: 0, sku: '', name: '' },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('At least one product item is required');
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);

  // Check if any product has insufficient stock
  const hasInsufficientStock = items.some(
    (item) => item.productId && item.quantity > item.availableStock
  );

  const handleSubmit = async (statusToSet) => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    const invalidItem = items.find((i) => !i.productId || i.quantity <= 0);
    if (invalidItem) {
      toast.error('Please select a valid product and quantity for all item rows');
      return;
    }

    if (statusToSet === 'CONFIRMED' && hasInsufficientStock) {
      toast.error('Cannot confirm challan: One or more products have insufficient stock!');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        status: statusToSet,
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      const res = await challanService.createChallan(payload);
      if (res.data.success) {
        toast.success(
          statusToSet === 'CONFIRMED'
            ? 'Sales Challan confirmed & inventory deducted!'
            : 'Sales Challan saved as draft'
        );
        navigate(`/challans/${res.data.data.challan.id}`);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create sales challan';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/challans"
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Generate New Sales Challan
          </h1>
          <p className="text-xs text-slate-500">
            Create wholesale dispatch challan, verify stock availability, and deduct inventory
          </p>
        </div>
      </div>

      {/* Customer Selection Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-amber-600" />
          1. Select Customer / Consignee
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Customer *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden bg-white"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} ({c.name} - {c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Snapshot Details Card */}
          {selectedCustomer && (
            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 text-xs space-y-1">
              <div className="font-bold text-slate-900">{selectedCustomer.businessName}</div>
              <div className="text-slate-700">Attn: {selectedCustomer.name} | Phone: {selectedCustomer.mobile}</div>
              {selectedCustomer.gstNumber && (
                <div className="text-[11px] text-amber-700 font-mono">GST: {selectedCustomer.gstNumber}</div>
              )}
              {selectedCustomer.address && (
                <div className="text-[11px] text-amber-600 truncate">{selectedCustomer.address}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Items Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" />
            2. Line Items & Products
          </h2>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
        </div>

        {hasInsufficientStock && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Warning: Some items exceed available warehouse stock! Please adjust quantities before confirming.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3">Product Description</th>
                <th className="py-2.5 px-3 text-center">Available Stock</th>
                <th className="py-2.5 px-3 w-28 text-center">Quantity</th>
                <th className="py-2.5 px-3 w-32 text-right">Unit Price (₹)</th>
                <th className="py-2.5 px-3 w-32 text-right">Subtotal (₹)</th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => {
                const isOutOfStock = item.productId && item.quantity > item.availableStock;
                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden bg-white"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.sku}] (Stock: {p.currentStock})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {item.productId ? (
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {item.availableStock} Units
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className={`w-full px-2 py-1 text-xs text-center border rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden font-bold ${
                          isOutOfStock ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        }`}
                      />
                    </td>

                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                        className="w-full px-2 py-1 text-xs text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden font-mono"
                      />
                    </td>

                    <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                      ₹{Number(item.subtotal).toFixed(2)}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Totals Box */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Total Items: <strong className="text-slate-900">{items.length} rows</strong> | Total Dispatch Quantity:{' '}
            <strong className="text-slate-900">{totalQuantity} units</strong>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 block">Grand Total Amount:</span>
            <span className="text-xl font-black text-slate-900 font-mono">
              ₹{Number(totalAmount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes & Dispatch Instructions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Challan Notes / Vehicle No / Dispatch Terms
        </label>
        <textarea
          rows="2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Dispatched via Truck DL-1A-9876. Driver Contact: 9811122233..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <Link
          to="/challans"
          className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 text-center"
        >
          Cancel
        </Link>

        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit('DRAFT')}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-slate-600" />
          Save as Draft
        </button>

        <button
          type="button"
          disabled={submitting || hasInsufficientStock}
          onClick={() => handleSubmit('CONFIRMED')}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Processing...' : 'Confirm & Reduce Stock'}
        </button>
      </div>
    </div>
  );
}
