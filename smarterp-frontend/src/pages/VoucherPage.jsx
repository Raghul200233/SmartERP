import React, { useState } from 'react';
import { VoucherList } from '../components/voucher/VoucherList';
import { PurchaseVoucher } from '../components/voucher/PurchaseVoucher';
import { SalesVoucher } from '../components/voucher/SalesVoucher';
import { VoucherDetail } from '../components/voucher/VoucherDetail';
import { useMainStore } from '../store/mainStore';

const VoucherPage = () => {
  const { vouchers } = useMainStore();
  const voucherList = vouchers.list || [];
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [voucherType, setVoucherType] = useState('PURCHASE');

  const handleAdd = (type = 'PURCHASE') => {
    setSelectedVoucher(null);
    setEditMode(false);
    setVoucherType(type);
    setShowForm(true);
  };

  const handleEdit = (voucher) => {
    setSelectedVoucher(voucher);
    setEditMode(true);
    setVoucherType(voucher.voucher_type);
    setShowForm(true);
  };

  const handleView = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetail(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedVoucher(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedVoucher(null);
  };

  const renderVoucherForm = () => {
    if (voucherType === 'PURCHASE') {
      return (
        <PurchaseVoucher
          voucher={editMode ? selectedVoucher : null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      );
    } else if (voucherType === 'SALES') {
      return (
        <SalesVoucher
          voucher={editMode ? selectedVoucher : null}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <VoucherList
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
        />

        {showForm && renderVoucherForm()}

        {showDetail && (
          <VoucherDetail
            voucher={selectedVoucher}
            onClose={() => {
              setShowDetail(false);
              setSelectedVoucher(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VoucherPage;