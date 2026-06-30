import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useStockStore } from '../../store/stockStore';
import { eventBus } from '../../utils/eventBus';
import { stockItemService, stockGroupService, unitService } from '../../services/stock.service';
import toast from 'react-hot-toast';

export const StockItemForm = ({ item, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const { setLoading } = useStockStore();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    stock_group_id: '',
    unit_id: '',
    purchase_price: 0,
    selling_price: 0,
    gst_percentage: 0,
    reorder_level: 0
  });
  const [stockGroups, setStockGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const isEdit = !!item;

  useEffect(() => {
    fetchStockGroups();
    fetchUnits();
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        barcode: item.barcode || '',
        stock_group_id: item.stock_group_id || '',
        unit_id: item.unit_id || '',
        purchase_price: item.purchase_price || 0,
        selling_price: item.selling_price || 0,
        gst_percentage: item.gst_percentage || 0,
        reorder_level: item.reorder_level || 0
      });
    }
  }, [item]);

  const fetchStockGroups = async () => {
    try {
      const data = await stockGroupService.getAll(currentCompany.id);
      setStockGroups(data);
    } catch (error) {
      console.error('Error fetching stock groups:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const data = await unitService.getAll(currentCompany.id);
      setUnits(data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    if (formData.sku && formData.sku.length > 50) {
      newErrors.sku = 'SKU must be less than 50 characters';
    }
    if (formData.purchase_price < 0) {
      newErrors.purchase_price = 'Purchase price cannot be negative';
    }
    if (formData.selling_price < 0) {
      newErrors.selling_price = 'Selling price cannot be negative';
    }
    if (formData.gst_percentage < 0 || formData.gst_percentage > 100) {
      newErrors.gst_percentage = 'GST must be between 0 and 100';
    }
    if (formData.opening_quantity < 0) {
      newErrors.opening_quantity = 'Opening quantity cannot be negative';
    }
    if (formData.reorder_level < 0) {
      newErrors.reorder_level = 'Reorder level cannot be negative';
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
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        gst_percentage: parseFloat(formData.gst_percentage) || 0,
        opening_quantity: parseFloat(formData.opening_quantity) || 0,
        reorder_level: parseFloat(formData.reorder_level) || 0
      };

      if (isEdit) {
        await stockItemService.update(currentCompany.id, item.id, data);
        toast.success('Stock item updated successfully');
      } else {
          const response = await stockItemService.create(currentCompany.id, data);
          eventBus.emitStockUpdated({
          ...response,
          current_quantity: data.opening_quantity || 0
        });
        toast.success('Stock item created successfully');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving stock item:', error);
      toast.error(error.response?.data?.message || 'Failed to save stock item');
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
            {isEdit ? 'Edit Stock Item' : 'Create Stock Item'}
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
            {/* Item Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter item name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.sku ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., PROD-001"
              />
              {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku}</p>}
            </div>

            {/* Barcode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter barcode"
              />
            </div>

            {/* Stock Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stock Group
              </label>
              <select
                value={formData.stock_group_id}
                onChange={(e) => setFormData({ ...formData, stock_group_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Group</option>
                    {Array.isArray(stockGroups) && stockGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unit
              </label>
              <select
                value={formData.unit_id}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Unit</option>
                {Array.isArray(units) && units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.purchase_price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.purchase_price && <p className="mt-1 text-sm text-red-500">{errors.purchase_price}</p>}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.selling_price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              {errors.selling_price && <p className="mt-1 text-sm text-red-500">{errors.selling_price}</p>}
            </div>

            {/* GST Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GST Percentage (%)
              </label>
              <input
                type="number"
                value={formData.gst_percentage}
                onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.gst_percentage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="18"
                step="0.01"
                min="0"
                max="100"
              />
              {errors.gst_percentage && <p className="mt-1 text-sm text-red-500">{errors.gst_percentage}</p>}
            </div>

            {/* Opening Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Opening Quantity
              </label>
              <input
                type="number"
                value={formData.opening_quantity}
                onChange={(e) => setFormData({ ...formData, opening_quantity: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.opening_quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
                step="1"
                min="0"
              />
              {errors.opening_quantity && <p className="mt-1 text-sm text-red-500">{errors.opening_quantity}</p>}
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reorder Level
              </label>
              <input
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.reorder_level ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
                step="1"
                min="0"
              />
              {errors.reorder_level && <p className="mt-1 text-sm text-red-500">{errors.reorder_level}</p>}
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
                isEdit ? 'Update Item' : 'Create Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};