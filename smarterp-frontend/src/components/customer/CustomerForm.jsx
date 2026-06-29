import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Phone } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useCustomerStore } from '../../store/customerStore';
import { customerService } from '../../services/customer.service';
import toast from 'react-hot-toast';

export const CustomerForm = ({ customer, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const { setLoading } = useCustomerStore();
  const [formData, setFormData] = useState({
    name: '',
    mobile: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const isEdit = !!customer;

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        mobile: customer.mobile || ''
      });
    }
  }, [customer]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    }
    if (formData.mobile && !/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Invalid mobile number (10 digits required)';
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
        name: formData.name.trim(),
        mobile: formData.mobile || null
      };

      if (isEdit) {
        await customerService.update(currentCompany.id, customer.id, data);
        toast.success('Customer updated successfully');
      } else {
        await customerService.create(currentCompany.id, data);
        toast.success('Customer created successfully');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(error.response?.data?.message || 'Failed to save customer');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Customer' : 'New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter customer name"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.mobile ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="9876543210"
                />
              </div>
              {errors.mobile && <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>}
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
                isEdit ? 'Update Customer' : 'Create Customer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};