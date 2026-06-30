import React, { useState , useEffect} from 'react';
import { SupplierList } from '../components/supplier/SupplierList';
import { SupplierForm } from '../components/supplier/SupplierForm';
import { SupplierDetails } from '../components/supplier/SupplierDetails';
import { useMainStore } from '../store/mainStore';
import { useSupplierStore } from '../store/supplierStore';
import { supplierService } from '../services/supplier.service';

const SupplierPage = () => {
  const { suppliers , currentCompany} = useMainStore();
  const supplierList = suppliers.list || [];
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
  if (currentCompany) {
    fetchSuppliers();
  }
}, [currentCompany]);

const fetchSuppliers = async () => {
  try {
    setLoading(true);
    const response = await supplierService.getAll(currentCompany.id);
    setSuppliers(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    setSuppliers([]);
  } finally {
    setLoading(false);
  }
};

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