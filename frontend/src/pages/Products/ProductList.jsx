import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productService, inventoryService } from '../../api/services';
import { downloadCSV } from '../../utils/csvExporter';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProductList() {
  const { hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const initialLowStock = searchParams.get('lowStock') === 'true';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(initialLowStock);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Add / Edit Product Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: '',
    currentStock: 0,
    minStockAlert: 5,
    location: '',
  });

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    movementType: 'IN',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({
        search,
        category: categoryFilter,
        lowStock: lowStockFilter ? 'true' : undefined,
        page,
        limit: 10,
      });
      if (res.data?.success) {
        setProducts(res.data.data.products);
        setCategories(res.data.data.categories);
        setPagination(res.data.data.pagination);
      }
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, lowStockFilter, page]);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delay);
  }, [fetchProducts]);

  const handleExportCSV = () => {
    if (!products.length) {
      toast.error('No products to export');
      return;
    }

    const columns = [
      { label: 'SKU', key: 'sku' },
      { label: 'Product Name', key: 'name' },
      { label: 'Category', key: 'category' },
      { label: 'Unit Price (INR)', value: (row) => Number(row.unitPrice).toFixed(2) },
      { label: 'Current Stock', key: 'currentStock' },
      { label: 'Min Alert Stock', key: 'minStockAlert' },
      { label: 'Location', key: 'location' },
    ];

    downloadCSV(products, columns, 'Inventory_Products_Report');
    toast.success('Inventory report downloaded as CSV');
  };

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        sku: product.sku,
        category: product.category,
        unitPrice: product.unitPrice,
        minStockAlert: product.minStockAlert,
        location: product.location || '',
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        sku: '',
        category: '',
        unitPrice: '',
        currentStock: 0,
        minStockAlert: 5,
        location: '',
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productForm);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(productForm);
        toast.success('Product created successfully');
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustForm({
      quantity: '',
      movementType: 'IN',
      reason: '',
    });
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (!adjustForm.reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.adjustStock({
        productId: selectedProduct.id,
        quantity: parseInt(adjustForm.quantity, 10),
        movementType: adjustForm.movementType,
        reason: adjustForm.reason,
      });
      toast.success('Stock adjusted successfully');
      setAdjustModalOpen(false);
      fetchProducts();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to adjust stock';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Products & Inventory Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SKUs, unit prices, real-time stock levels, and warehouse locations
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

          {hasRole('ADMIN', 'WAREHOUSE') && (
            <button
              onClick={() => handleOpenProductModal()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by SKU, name, category, location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setLowStockFilter((prev) => !prev);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              lowStockFilter
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Alert Only</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4">Warehouse Location</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No products found matching your search
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {p.sku}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{Number(p.unitPrice).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-black px-2.5 py-0.5 rounded-md text-xs border ${
                              isLowStock
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {p.currentStock} Units
                          </span>
                          {isLowStock && (
                            <span title={`Low stock! Min alert threshold is ${p.minStockAlert}`}>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {p.location || <span className="text-slate-400">Not assigned</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasRole('ADMIN', 'WAREHOUSE') && (
                            <button
                              onClick={() => handleOpenAdjustModal(p)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors"
                              title="Adjust Stock In / Out"
                            >
                              <ArrowUpDown className="w-3 h-3 text-amber-600" />
                              Adjust Stock
                            </button>
                          )}
                          {hasRole('ADMIN', 'WAREHOUSE') && (
                            <button
                              onClick={() => handleOpenProductModal(p)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                {editingProduct ? 'Edit Product SKU' : 'Create New Product'}
              </h2>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                  placeholder="e.g. Industrial Relay 24V"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU / Product Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden uppercase font-mono"
                    placeholder="REL-24V-HD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                    placeholder="Electricals"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={productForm.unitPrice}
                    onChange={(e) => setProductForm({ ...productForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden font-bold"
                    placeholder="450.00"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Opening Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.currentStock}
                      onChange={(e) =>
                        setProductForm({ ...productForm, currentStock: parseInt(e.target.value || '0', 10) })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                      placeholder="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.minStockAlert}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        minStockAlert: parseInt(e.target.value || '0', 10),
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warehouse Location / Bay
                </label>
                <input
                  type="text"
                  value={productForm.location}
                  onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                  placeholder="e.g. Rack A-12, Warehouse 1"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock In / Out Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-amber-400" />
                Adjust Stock Level
              </h2>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Selected Product:</div>
                <div className="text-sm font-bold text-slate-900">{selectedProduct.name}</div>
                <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                  <span>SKU: {selectedProduct.sku}</span>
                  <span className="font-bold text-amber-700">
                    Current Stock: {selectedProduct.currentStock}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Movement Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, movementType: 'IN' })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      adjustForm.movementType === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    + Stock IN (Restock)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, movementType: 'OUT' })}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                      adjustForm.movementType === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    - Stock OUT (Dispatch/Damaged)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden font-bold"
                  placeholder="e.g. 10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:outline-hidden"
                  placeholder="e.g. Factory shipment received / Quality check scrap"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Applying...' : 'Confirm Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
