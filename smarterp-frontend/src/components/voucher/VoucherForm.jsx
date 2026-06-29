import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Search } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useVoucherStore } from '../../store/voucherStore';
import { voucherService } from '../../services/voucher.service';
import { ledgerService } from '../../services/ledger.service';
import { stockItemService } from '../../services/stock.service';
import toast from 'react-hot-toast';

const VOUCHER_TYPES = [
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'SALES', label: 'Sales' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'CONTRA', label: 'Contra' },
  { value: 'JOURNAL', label: 'Journal' },
  { value: 'CREDIT_NOTE', label: 'Credit Note' },
  { value: 'DEBIT_NOTE', label: 'Debit Note' }
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'POSTED', label: 'Posted' }
];

export const VoucherForm = ({ voucher, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const { setLoading } = useVoucherStore();
  const [formData, setFormData] = useState({
    voucher_type: 'PURCHASE',
    date: new Date().toISOString().split('T')[0],
    ledger_id: '',
    amount: 0,
    narration: '',
    reference_number: '',
    status: 'DRAFT',
    entries: [{ ledger_id: '', amount: 0, entry_type: 'DEBIT' }]
  });
  const [ledgers, setLedgers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const isEdit = !!voucher;

  useEffect(() => {
    fetchLedgers();
    fetchStockItems();
    if (voucher) {
      setFormData({
        voucher_type: voucher.voucher_type || 'PURCHASE',
        date: voucher.date || new Date().toISOString().split('T')[0],
        ledger_id: voucher.ledger_id || '',
        amount: voucher.amount || 0,
        narration: voucher.narration || '',
        reference_number: voucher.reference_number || '',
        status: voucher.status || 'DRAFT',
        entries: voucher.voucher_entries?.map(e => ({
          ledger_id: e.ledger_id,
          amount: e.amount,
          entry_type: e.entry_type
        })) || [{ ledger_id: '', amount: 0, entry_type: 'DEBIT' }]
      });
    }
  }, [voucher]);

  const fetchLedgers = async () => {
    try {
      const data = await ledgerService.getAll(currentCompany.id);
      setLedgers(data || []);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
    }
  };

  const fetchStockItems = async () => {
    try {
      const data = await stockItemService.getAll(currentCompany.id);
      setStockItems(data || []);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleEntryChange = (index, field, value) => {
    const newEntries = [...formData.entries];
    newEntries[index][field] = value;
    setFormData(prev => ({ ...prev, entries: newEntries }));
  };

  const addEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [...prev.entries, { ledger_id: '', amount: 0, entry_type: 'DEBIT' }]
    }));
  };

  const removeEntry = (index) => {
    if (formData.entries.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.voucher_type) {
      newErrors.voucher_type = 'Voucher type is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (formData.entries.some(e => !e.ledger_id)) {
      newErrors.entries = 'All entries must have a ledger';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLocalLoading(true);
      setLoading(true);

      const data = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        entries: formData.entries.map(e => ({
          ...e,
          amount: parseFloat(e.amount) || 0
        }))
      };

      if (isEdit) {
        await voucherService.update(currentCompany.id, voucher.id, data);
        toast.success('Voucher updated successfully');
      } else {
        await voucherService.create(currentCompany.id, data);
        toast.success('Voucher created successfully');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving voucher:', error);
      toast.error(error.response?.data?.message || 'Failed to save voucher');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Voucher' : 'Create Voucher'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voucher Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voucher Type *
              </label>
              <select
                name="voucher_type"
                value={formData.voucher_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.voucher_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {VOUCHER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>

            {/* Ledger */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ledger
              </label>
              <select
                name="ledger_id"
                value={formData.ledger_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Ledger</option>
                {ledgers.map(ledger => (
                  <option key={ledger.id} value={ledger.id}>
                    {ledger.name} ({ledger.ledger_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                step="0.01"
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Optional reference"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Narration */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Narration
              </label>
              <textarea
                name="narration"
                value={formData.narration}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter narration"
              />
            </div>
          </div>

          {/* Voucher Entries */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Voucher Entries</h3>
              <button
                type="button"
                onClick={addEntry}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>

            {errors.entries && (
              <p className="text-sm text-red-500 mb-2">{errors.entries}</p>
            )}

            <div className="space-y-3">
              {formData.entries.map((entry, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={entry.ledger_id}
                      onChange={(e) => handleEntryChange(index, 'ledger_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Ledger</option>
                      {ledgers.map(ledger => (
                        <option key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      value={entry.amount}
                      onChange={(e) => handleEntryChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Amount"
                      step="0.01"
                    />
                  </div>
                  <div className="w-28">
                    <select
                      value={entry.entry_type}
                      onChange={(e) => handleEntryChange(index, 'entry_type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

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
                isEdit ? 'Update Voucher' : 'Create Voucher'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};