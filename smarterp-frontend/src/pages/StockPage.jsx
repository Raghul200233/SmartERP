import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { StockGroupList } from '../components/stock/StockGroupList';
import { StockGroupForm } from '../components/stock/StockGroupForm';
import { StockItemList } from '../components/stock/StockItemList';
import { StockItemForm } from '../components/stock/StockItemForm';

const StockPage = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleAddGroup = () => {
    setSelectedGroup(null);
    setEditMode(false);
    setShowGroupForm(true);
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setEditMode(true);
    setShowGroupForm(true);
  };

  const handleGroupFormClose = () => {
    setShowGroupForm(false);
    setSelectedGroup(null);
  };

  const handleGroupFormSuccess = () => {
    setShowGroupForm(false);
    setSelectedGroup(null);
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setEditMode(false);
    setShowItemForm(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setEditMode(true);
    setShowItemForm(true);
  };

  const handleItemFormClose = () => {
    setShowItemForm(false);
    setSelectedItem(null);
  };

  const handleItemFormSuccess = () => {
    setShowItemForm(false);
    setSelectedItem(null);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Stock Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your inventory, stock groups, and units
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="items">Stock Items</TabsTrigger>
            <TabsTrigger value="groups">Stock Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <StockItemList
              onAdd={handleAddItem}
              onEdit={handleEditItem}
            />
          </TabsContent>

          <TabsContent value="groups">
            <StockGroupList
              onAdd={handleAddGroup}
              onEdit={handleEditGroup}
            />
          </TabsContent>
        </Tabs>

        {/* Stock Group Form Modal */}
        {showGroupForm && (
          <StockGroupForm
            group={editMode ? selectedGroup : null}
            onClose={handleGroupFormClose}
            onSuccess={handleGroupFormSuccess}
          />
        )}

        {/* Stock Item Form Modal */}
        {showItemForm && (
          <StockItemForm
            item={editMode ? selectedItem : null}
            onClose={handleItemFormClose}
            onSuccess={handleItemFormSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default StockPage;