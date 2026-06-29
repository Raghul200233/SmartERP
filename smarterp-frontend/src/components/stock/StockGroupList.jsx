import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderTree, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { useCompanyStore } from '../../store/companyStore';
import { useStockStore } from '../../store/stockStore';
import { stockGroupService } from '../../services/stock.service';
import toast from 'react-hot-toast';

export const StockGroupList = ({ onEdit, onAdd, onView }) => {
  const { currentCompany } = useCompanyStore();
  const { stockGroups, setStockGroups, isLoading, setLoading } = useStockStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  useEffect(() => {
    if (currentCompany) {
      fetchGroups();
    }
  }, [currentCompany]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await stockGroupService.getAll(currentCompany.id);
      setStockGroups(data);
    } catch (error) {
      console.error('Error fetching stock groups:', error);
      toast.error('Failed to load stock groups');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`Are you sure you want to delete "${group.name}"?`)) {
      return;
    }

    try {
      await stockGroupService.delete(currentCompany.id, group.id);
      toast.success('Stock group deleted successfully');
      fetchGroups();
    } catch (error) {
      console.error('Error deleting stock group:', error);
      toast.error(error.response?.data?.message || 'Failed to delete stock group');
    }
  };

  const toggleExpand = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredGroups = stockGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Build tree structure
  const buildTree = (groups, parentId = null) => {
    return groups
      .filter(g => g.parent_id === parentId)
      .map(g => ({
        ...g,
        children: buildTree(groups, g.id)
      }));
  };

  const treeData = buildTree(filteredGroups);

  const renderGroup = (group, level = 0) => {
    const hasChildren = group.children && group.children.length > 0;
    const isExpanded = expandedGroups.has(group.id);

    return (
      <div key={group.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
        <div 
          className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
          style={{ paddingLeft: `${level * 20 + 16}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(group.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>
            )}
            <FolderTree className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">{group.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {group._count?.stockItems || 0} items
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(group)}
              className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(group)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-8">
            {group.children.map(child => renderGroup(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Stock Groups
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Organize your stock items into groups
            </p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={fetchGroups}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full spinner mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading groups...</p>
          </div>
        </div>
      ) : treeData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No stock groups found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first stock group to organize your inventory
          </p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {treeData.map(group => renderGroup(group))}
        </div>
      )}
    </div>
  );
};