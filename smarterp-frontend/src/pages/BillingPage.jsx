import React, { useState } from 'react';
import { InvoiceList } from '../components/billing/InvoiceList';
import { InvoiceForm } from '../components/billing/InvoiceForm';
import { InvoicePreview } from '../components/billing/InvoicePreview';

const BillingPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleAdd = () => {
    setSelectedInvoice(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setEditMode(true);
    setShowForm(true);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedInvoice(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedInvoice(null);
  };

  const handlePreviewClose = () => {
    setShowPreview(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <InvoiceList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
        />

        {showForm && (
          <InvoiceForm
            invoice={editMode ? selectedInvoice : null}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}

        {showPreview && (
          <InvoicePreview
            invoice={selectedInvoice}
            onClose={handlePreviewClose}
          />
        )}
      </div>
    </div>
  );
};

export default BillingPage;