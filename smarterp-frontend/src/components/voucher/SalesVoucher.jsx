import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Printer, Download } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { voucherService } from '../../services/voucher.service';
import { ledgerService } from '../../services/ledger.service';
import { customerService } from '../../services/customer.service';
import { stockItemService } from '../../services/stock.service';
import toast from 'react-hot-toast';

export const SalesVoucher = ({ voucher, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const [formData, setFormData] = useState({
    customer_id: '',
    date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    items: [{ stock_item_id: '', quantity: 1, rate: 0, gst: 0, amount: 0 }],
    discount: 0,
    narration: '',
    status: 'DRAFT'
  });
  const [customers, setCustomers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const isEdit = !!voucher;
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    totalGst: 0,
    totalDiscount: 0,
    grandTotal: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchStockItems();
    fetchLedgers();
    if (voucher) {
      loadVoucherData();
    }
  }, [voucher]);

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
    } catch (error) {
      console.error('Error fetching stock items:', error);
      setStockItems([]);
    }
  };

  const fetchLedgers = async () => {
    try {
      const response = await ledgerService.getAll(currentCompany.id);
      setLedgers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      setLedgers([]);
    }
  };

  const loadVoucherData = () => {
    if (voucher) {
      // Load data for editing
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { stock_item_id: '', quantity: 1, rate: 0, gst: 0, amount: 0 }]
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
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      newItems[index].amount = quantity * rate;
      
      const gstPercent = parseFloat(newItems[index].gst) || 0;
      newItems[index].gstAmount = (newItems[index].amount * gstPercent) / 100;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
    calculateTotals();
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalGst = 0;

    formData.items.forEach(item => {
      const amount = parseFloat(item.amount) || 0;
      const gst = parseFloat(item.gst) || 0;
      subtotal += amount;
      totalGst += (amount * gst) / 100;
    });

    const totalDiscount = parseFloat(formData.discount) || 0;
    const grandTotal = subtotal + totalGst - totalDiscount;

    setCalculatedTotals({
      subtotal,
      totalGst,
      totalDiscount,
      grandTotal
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (formData.items.some(item => !item.stock_item_id)) {
      newErrors.items = 'All items must have a stock item selected';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLocalLoading(true);

      // Find Sales ledger (Direct Income)
      const salesLedger = ledgers.find(l => l.name === 'Sales' || l.ledger_type === 'INCOME');
      
      const voucherData = {
        voucher_type: 'SALES',
        date: formData.date,
        ledger_id: formData.customer_id,
        amount: calculatedTotals.grandTotal,
        narration: formData.narration,
        reference_number: formData.invoice_number,
        status: formData.status,
        items: formData.items.map(item => ({
          stock_item_id: item.stock_item_id,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          gst_percentage: parseFloat(item.gst) || 0,
          amount: parseFloat(item.amount) || 0,
          gst_amount: parseFloat(item.gstAmount) || 0
        })),
        entries: [
          {
            ledger_id: formData.customer_id,
            amount: calculatedTotals.grandTotal,
            entry_type: 'DEBIT'
          },
          {
            ledger_id: salesLedger?.id || formData.customer_id,
            amount: calculatedTotals.subtotal,
            entry_type: 'CREDIT'
          }
        ]
      };

      if (isEdit) {
        await voucherService.update(currentCompany.id, voucher.id, voucherData);
        toast.success('Sales voucher updated successfully');
      } else {
        await voucherService.create(currentCompany.id, voucherData);
        toast.success('Sales voucher created successfully');
        // Generate invoice number
        const invoiceNumber = `INV-${String(Date.now()).slice(-6)}`;
        toast.success(`Invoice #${invoiceNumber} generated`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving sales voucher:', error);
      toast.error(error.response?.data?.message || 'Failed to save sales voucher');
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
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Sales Voucher' : 'New Sales Voucher'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Print Invoice"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Header Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.customer_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select Customer</option>
                {Array.isArray(customers) && customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customer_id && <p className="mt-1 text-sm text-red-500">{errors.customer_id}</p>}
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
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Auto-generated"
                disabled
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Sales Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {errors.items && <p className="text-sm text-red-500 mb-2">{errors.items}</p>}

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Item</label>
                    <select
                      value={item.stock_item_id}
                      onChange={(e) => updateItem(index, 'stock_item_id', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Item</option>
                      {Array.isArray(stockItems) && stockItems.map(si => (
                        <option key={si.id} value={si.id}>
                          {si.name} (Stock: {si.current_quantity || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rate</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">GST%</label>
                    <input
                      type="number"
                      value={item.gst}
                      onChange={(e) => updateItem(index, 'gst', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      min="0"
                      max="100"
                      step="0.01"
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
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => {
                    setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 });
                    calculateTotals();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="POSTED">Posted</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Subtotal</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculatedTotals.subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">GST</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(calculatedTotals.totalGst)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Discount</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">-{formatCurrency(calculatedTotals.totalDiscount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Grand Total</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(calculatedTotals.grandTotal)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Narration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Narration
            </label>
            <textarea
              value={formData.narration}
              onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Additional notes"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEdit ? 'Update Sales' : 'Create Sales'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};