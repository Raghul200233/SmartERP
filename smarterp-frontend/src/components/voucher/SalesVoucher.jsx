import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Printer, Download } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { voucherService } from '../../services/voucher.service';
import { customerService } from '../../services/customer.service';
import { stockItemService } from '../../services/stock.service';
import { useVoucherStore } from '../../store/voucherStore';
import { useStockStore } from '../../store/stockStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { eventBus } from '../../utils/eventBus';
import toast from 'react-hot-toast';

export const SalesVoucher = ({ voucher, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const { addVoucher, updateStats } = useVoucherStore();
  const { updateStockItem } = useStockStore();
  const { updateDashboardData } = useDashboardStore();
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: 'Walk-in Customer',
    date: new Date().toISOString().split('T')[0],
    items: [{ stock_item_id: '', quantity: 1, rate: 0, amount: 0 }],
    payment_type: 'CASH',
    narration: '',
    status: 'POSTED'
  });
  const [customers, setCustomers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});

  const isEdit = !!voucher;
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    grandTotal: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchStockItems();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll(currentCompany.id);
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchStockItems = async () => {
    try {
      const response = await stockItemService.getAll(currentCompany.id);
      setStockItems(Array.isArray(response.data) ? response.data : []);
      
      // Store selling prices for quick lookup
      const prices = {};
      response.data.forEach(item => {
        prices[item.id] = item.selling_price || 0;
      });
      setSelectedItems(prices);
    } catch (error) {
      console.error('Error fetching stock items:', error);
      setStockItems([]);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { stock_item_id: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    calculateTotals();
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'stock_item_id') {
      // Auto-fill rate from selling price
      const rate = selectedItems[value] || 0;
      newItems[index].stock_item_id = value;
      newItems[index].rate = rate;
      newItems[index].amount = (newItems[index].quantity || 1) * rate;
    } else if (field === 'quantity') {
      newItems[index].quantity = parseFloat(value) || 0;
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    } else {
      newItems[index][field] = value;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
    calculateTotals();
  };

  const calculateTotals = () => {
    let subtotal = 0;
    formData.items.forEach(item => {
      subtotal += parseFloat(item.amount) || 0;
    });
    setCalculatedTotals({ subtotal, grandTotal: subtotal });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (formData.items.some(item => !item.stock_item_id)) {
      newErrors.items = 'All items must have a stock item selected';
    }
    if (formData.items.some(item => item.quantity <= 0)) {
      newErrors.items = 'All items must have quantity greater than 0';
    }
    if (!formData.payment_type) {
      newErrors.payment_type = 'Payment type is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLocalLoading(true);

      const customer = customers.find(c => c.id === formData.customer_id);
      
      const voucherData = {
        voucher_type: 'SALES',
        date: formData.date,
        ledger_id: formData.customer_id || null,
        ledger_name: customer?.name || formData.customer_name || 'Walk-in Customer',
        ledger_type: 'CUSTOMER',
        amount: calculatedTotals.grandTotal,
        payment_type: formData.payment_type,
        narration: formData.narration || `Sales to ${customer?.name || 'Walk-in Customer'}`,
        status: 'POSTED',
        items: formData.items.map(item => ({
          stock_item_id: item.stock_item_id,
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          selling_price: parseFloat(item.rate) || 0,
          amount: parseFloat(item.amount) || 0
        }))
      };

    const response = await voucherService.create(currentCompany.id, voucherData);

       // ✅ Emit events for real-time updates
    eventBus.emitVoucherCreated({
      ...response,
      voucher_type: 'SALES',
      amount: calculatedTotals.grandTotal,
      payment_type: formData.payment_type,
      items: formData.items
    });

    // Emit stock updates for each item (decrease stock)
    formData.items.forEach(item => {
      eventBus.emitStockUpdated({
        id: item.stock_item_id,
        current_quantity: (item.current_quantity || 0) - parseFloat(item.quantity)
      });
    });
    
    // ✅ Update store immediately
    addVoucher(response);
    
    // ✅ Update stock items in store (decrease quantity)
    formData.items.forEach(item => {
      updateStockItem(item.stock_item_id, {
        current_quantity: (item.current_quantity || 0) - parseFloat(item.quantity)
      });
    });

    // ✅ Update dashboard stats
    updateDashboardData({
      todaySales: (dashboardData?.todaySales || 0) + calculatedTotals.grandTotal,
      stockValue: (dashboardData?.stockValue || 0) - calculatedTotals.grandTotal
    });
      
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      toast.success(`Sales voucher created! Invoice #${invoiceNumber}`);
      toast.success(`Payment: ${formData.payment_type} - ₹${calculatedTotals.grandTotal.toFixed(2)}`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to create sales voucher');
    } finally {
      setLocalLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Sales Voucher' : 'New Sales Voucher'}
          </h2>
          <div className="flex items-center gap-2">
            <button type="button" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Print Invoice">
              <Printer className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Download PDF">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    customer_id: e.target.value,
                    customer_name: customer?.name || 'Walk-in Customer'
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Walk-in Customer</option>
                {Array.isArray(customers) && customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Type *
              </label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.payment_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
              </select>
              {errors.payment_type && <p className="mt-1 text-sm text-red-500">{errors.payment_type}</p>}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sales Items</h3>
              <button type="button" onClick={addItem} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {errors.items && <p className="text-sm text-red-500 mb-2">{errors.items}</p>}

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="col-span-5">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Item</label>
                    <select
                      value={item.stock_item_id}
                      onChange={(e) => updateItem(index, 'stock_item_id', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Item</option>
                      {Array.isArray(stockItems) && stockItems.map(si => {
                        const stock = si.current_quantity || 0;
                        return (
                          <option key={si.id} value={si.id} disabled={stock <= 0}>
                            {si.name} (Stock: {stock})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg"
                      min="1"
                      step="1"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rate</label>
                    <input
                      type="text"
                      value={formatCurrency(item.rate)}
                      className="w-full px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-300"
                      readOnly
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                    <input
                      type="text"
                      value={formatCurrency(item.amount)}
                      className="w-full px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-300"
                      readOnly
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button type="button" onClick={() => removeItem(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Narration
                </label>
                <textarea
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  placeholder="Additional notes"
                />
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Subtotal</p>
                    <p className="font-semibold">{formatCurrency(calculatedTotals.subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-blue-600">{formatCurrency(calculatedTotals.grandTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Sales'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};