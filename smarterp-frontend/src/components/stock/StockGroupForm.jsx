import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useStockStore } from '../../store/stockStore';
import { stockGroupService } from '../../services/stock.service';
import toast from 'react-hot-toast';

export const StockGroupForm = ({ group, onClose, onSuccess }) => {
  const { currentCompany } = useCompanyStore();
  const { stockGroups, setLoading } = useStockStore();
  const [formData, setFormData] = useState({
    name: '',
    parent_id: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLocalLoading] = useState(false);

  const isEdit = !!group;

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        parent_id: group.parent_id || ''
      });
    }
  }, [group]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
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

        const submitData = {
            name: formData.name.trim(),
            parent_id: formData.parent_id || null
        };

        console.log('Submitting stock group:', submitData);
        console.log('Is edit:', isEdit);
        console.log('Group id:', group?.id);

        let result;
        if (isEdit) {
            console.log('Calling update with:', {
                companyId: currentCompany.id,
                id: group.id,
                data: submitData
            });
            result = await stockGroupService.update(
                currentCompany.id, 
                group.id, 
                submitData
            );
            console.log('Update result:', result);
            toast.success('Stock group updated successfully');
        } else {
            result = await stockGroupService.create(currentCompany.id, submitData);
            toast.success('Stock group created successfully');
        }

        if (onSuccess) onSuccess();
        onClose();
    } catch (error) {
        console.error('Error saving stock group:', error);
        console.error('Error response:', error.response);
        console.error('Error data:', error.response?.data);
        
        const message = error.response?.data?.message || error.message || 'Failed to save stock group';
        toast.error(message);
    } finally {
        setLocalLoading(false);
        setLoading(false);
    }
};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Stock Group' : 'Create Stock Group'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter group name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Parent Group (Optional)
            </label>
            <select
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">None (Top Level)</option>
              {stockGroups
                .filter(g => g.id !== group?.id)
                .map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
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
                isEdit ? 'Update Group' : 'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};