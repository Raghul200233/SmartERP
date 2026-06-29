import React, { useState } from 'react';
import { SupplierList } from '../components/supplier/SupplierList';
import { SupplierForm } from '../components/supplier/SupplierForm';
import { SupplierDetails } from '../components/supplier/SupplierDetails';

const SupplierPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleAdd = () => {
    setSelectedSupplier(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setEditMode(true);
    setShowForm(true);
  };

  const handleView = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetails(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedSupplier(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedSupplier(null);
  };

  const handleDetailsClose = () => {
    setShowDetails(false);
    setSelectedSupplier(null);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <SupplierList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
        />

        {showForm && (
          <SupplierForm
            supplier={editMode ? selectedSupplier : null}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}

        {showDetails && (
          <SupplierDetails
            supplier={selectedSupplier}
            onClose={handleDetailsClose}
          />
        )}
      </div>
    </div>
  );
};

export default SupplierPage;