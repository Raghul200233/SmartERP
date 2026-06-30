import React, { useState , useEffect} from 'react';
import { CustomerList } from '../components/customer/CustomerList';
import { CustomerForm } from '../components/customer/CustomerForm';
import { CustomerLedger } from '../components/customer/CustomerLedger';
import { useMainStore } from '../store/mainStore';
import { useCustomerStore } from '../store/customerStore';
import { customerService } from '../services/customer.service';

const CustomerPage = () => {
  const { customers , currentCompany} = useMainStore();
  const customerList = customers.list || [];
  const [showForm, setShowForm] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
  if (currentCompany) {
    fetchCustomers();
  }
}, [currentCompany]);

const fetchCustomers = async () => {
  try {
    setLoading(true);
    const response = await customerService.getAll(currentCompany.id);
    setCustomers(Array.isArray(response.data) ? response.data : []);
  } catch (error) {
    console.error('Error fetching customers:', error);
    setCustomers([]);
  } finally {
    setLoading(false);
  }
};

  const handleAdd = () => {
    setSelectedCustomer(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setEditMode(true);
    setShowForm(true);
  };

  const handleView = (customer) => {
    setSelectedCustomer(customer);
    setShowLedger(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCustomer(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCustomer(null);
  };

  const handleLedgerClose = () => {
    setShowLedger(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <CustomerList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
        />

        {showForm && (
          <CustomerForm
            customer={editMode ? selectedCustomer : null}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}

        {showLedger && (
          <CustomerLedger
            customer={selectedCustomer}
            onClose={handleLedgerClose}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerPage;