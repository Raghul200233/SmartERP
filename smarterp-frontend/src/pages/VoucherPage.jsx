import React, { useState, useEffect } from 'react';
import { useCompanyStore } from '../store/companyStore';
import { useVoucherStore } from '../store/voucherStore';
import { voucherService } from '../services/voucher.service';
import { VoucherList } from '../components/voucher/VoucherList';
import { PurchaseVoucher } from '../components/voucher/PurchaseVoucher';
import { SalesVoucher } from '../components/voucher/SalesVoucher';
import { VoucherDetail } from '../components/voucher/VoucherDetail';
import toast from 'react-hot-toast';

const VoucherPage = () => {
  const { currentCompany } = useCompanyStore();
  const { vouchers, setVouchers, setLoading, isLoading } = useVoucherStore();
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [voucherType, setVoucherType] = useState('PURCHASE');
  
useEffect(() => {
    if (currentCompany) {
      fetchVouchers();
    }
  }, [currentCompany]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherService.getAll(currentCompany.id);
      console.log('Fetched vouchers:', response); // Debug log
      
      // Ensure we set an array
      const voucherList = Array.isArray(response?.data) ? response.data : 
                         Array.isArray(response) ? response : [];
      setVouchers(voucherList);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Failed to load vouchers');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

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
          vouchers={vouchers}
          isLoading={isLoading}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onView={handleView}
          onRefresh={fetchVouchers}
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