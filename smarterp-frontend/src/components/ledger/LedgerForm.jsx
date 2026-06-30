import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useLedgerStore } from '../../store/ledgerStore';
import { ledgerService, accountGroupService } from '../../services/ledger.service';
import { eventBus } from '../../utils/eventBus';
import toast from 'react-hot-toast';

const LEDGER_TYPES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'SUPPLIER', label: 'Supplier' },
  { value: 'BANK', label: 'Bank' },
  { value: 'CASH', label: 'Cash' },
  { value: 'STOCK', label: 'Stock' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' }
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' }
];

export const LedgerForm = ({ ledger, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const { setLoading } = useLedgerStore();
  const [formData, setFormData] = useState({
    name: '',
    ledger_type: 'CUSTOMER',
    group_id: '',
    gst_number: '',
    mobile: '',
    address: '',
    opening_balance: 0,
    credit_limit: 0,
    status: 'ACTIVE'
  });
  const [groups, setGroups] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const isEdit = !!ledger;

  useEffect(() => {
    fetchGroups();
    if (ledger) {
      setFormData({
        name: ledger.name || '',
        ledger_type: ledger.ledger_type || 'CUSTOMER',
        group_id: ledger.group_id || '',
        gst_number: ledger.gst_number || '',
        mobile: ledger.mobile || '',
        address: ledger.address || '',
        opening_balance: ledger.opening_balance || 0,
        credit_limit: ledger.credit_limit || 0,
        status: ledger.status || 'ACTIVE'
      });
    }
  }, [ledger]);

  const fetchGroups = async () => {
    try {
      const data = await accountGroupService.getAll(currentCompany.id);
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load account groups');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Ledger name is required';
    }
    if (!formData.ledger_type) {
      newErrors.ledger_type = 'Ledger type is required';
    }
    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number (10 digits required)';
    }
    if (formData.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst_number)) {
      newErrors.gst_number = 'Invalid GST number format';
    }
    if (formData.opening_balance < 0) {
      newErrors.opening_balance = 'Opening balance cannot be negative';
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
        opening_balance: parseFloat(formData.opening_balance) || 0,
        credit_limit: parseFloat(formData.credit_limit) || 0
      };

      if (isEdit) {
        await ledgerService.update(currentCompany.id, ledger.id, data);
        toast.success('Ledger updated successfully');
      } else {
        const response = await ledgerService.create(currentCompany.id, data);
        eventBus.emitLedgerCreated(response);
        toast.success('Ledger created successfully');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving ledger:', error);
      const message = error.response?.data?.message || 'Failed to save ledger';
      toast.error(message);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Ledger' : 'Create New Ledger'}
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
            {/* Ledger Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ledger Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter ledger name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Ledger Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ledger Type *
              </label>
              <select
                name="ledger_type"
                value={formData.ledger_type}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.ledger_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {LEDGER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.ledger_type && <p className="mt-1 text-sm text-red-500">{errors.ledger_type}</p>}
            </div>

            {/* Account Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Group
              </label>
              <select
                name="group_id"
                value={formData.group_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Group</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.mobile ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="9876543210"
              />
              {errors.mobile && <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>}
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GST Number
              </label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.gst_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="22AAAAA0000A1Z5"
              />
              {errors.gst_number && <p className="mt-1 text-sm text-red-500">{errors.gst_number}</p>}
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opening Balance
              </label>
              <input
                type="number"
                name="opening_balance"
                value={formData.opening_balance}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.opening_balance ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
                step="0.01"
              />
              {errors.opening_balance && <p className="mt-1 text-sm text-red-500">{errors.opening_balance}</p>}
            </div>

            {/* Credit Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit Limit
              </label>
              <input
                type="number"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="0"
                step="0.01"
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

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter address"
              />
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
                isEdit ? 'Update Ledger' : 'Create Ledger'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};