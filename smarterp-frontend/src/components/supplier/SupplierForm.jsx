import React, { useState, useEffect } from 'react';
import { X, Loader2, Truck, Phone, Building2, CreditCard ,DollarSign} from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useSupplierStore } from '../../store/supplierStore';
import { supplierService } from '../../services/supplier.service';
import { eventBus } from '../../utils/eventBus';
import toast from 'react-hot-toast';

export const SupplierForm = ({ supplier, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const { setLoading } = useSupplierStore();
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    address: '',
    gst_number: '',
    outstanding_dues: 0
  });
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const isEdit = !!supplier;

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        contact_number: supplier.contact_number || '',
        address: supplier.address || '',
        gst_number: supplier.gst_number || '',
        outstanding_dues: supplier.outstanding_dues || 0
      });
    }
  }, [supplier]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }
    if (formData.contact_number && !/^[0-9]{10}$/.test(formData.contact_number)) {
      newErrors.contact_number = 'Invalid phone number (10 digits required)';
    }
    if (formData.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst_number)) {
      newErrors.gst_number = 'Invalid GST number format';
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
        outstanding_dues: parseFloat(formData.outstanding_dues) || 0
      };

      if (isEdit) {
        await supplierService.update(currentCompany.id, supplier.id, data);
        toast.success('Supplier updated successfully');
      } else {
        const response = await supplierService.create(currentCompany.id, data);
        eventBus.emitSupplierCreated(response);
        toast.success('Supplier created successfully');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Supplier' : 'New Supplier'}
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
            {/* Supplier Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supplier Name *
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter supplier name"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.contact_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="9876543210"
                />
              </div>
              {errors.contact_number && <p className="mt-1 text-sm text-red-500">{errors.contact_number}</p>}
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GST Number
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.gst_number ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              {errors.gst_number && <p className="mt-1 text-sm text-red-500">{errors.gst_number}</p>}
            </div>

            {/* Outstanding Dues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Outstanding Dues (₹)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.outstanding_dues}
                  onChange={(e) => setFormData({ ...formData, outstanding_dues: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows="3"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter supplier address"
                />
              </div>
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
                isEdit ? 'Update Supplier' : 'Create Supplier'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};