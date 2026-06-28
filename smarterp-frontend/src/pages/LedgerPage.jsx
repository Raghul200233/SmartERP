import React, { useState } from 'react';
import { LedgerList } from '../components/ledger/LedgerList';
import { LedgerForm } from '../components/ledger/LedgerForm';
import { LedgerStatement } from '../components/ledger/LedgerStatement';

const LedgerPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const handleAdd = () => {
    setSelectedLedger(null);
    setEditMode(false);
    setShowForm(true);
  };

  const handleEdit = (ledger) => {
    setSelectedLedger(ledger);
    setEditMode(true);
    setShowForm(true);
  };

  const handleView = (ledger) => {
    setSelectedLedger(ledger);
    setShowStatement(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedLedger(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedLedger(null);
    // Refresh the list will happen in the LedgerList component
  };

  const handleStatementClose = () => {
    setShowStatement(false);
    setSelectedLedger(null);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <LedgerList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
        />

        {/* Ledger Form Modal */}
        {showForm && (
          <LedgerForm
            ledger={editMode ? selectedLedger : null}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Ledger Statement Modal */}
        {showStatement && (
          <LedgerStatement
            ledger={selectedLedger}
            onClose={handleStatementClose}
          />
        )}
      </div>
    </div>
  );
};

export default LedgerPage;