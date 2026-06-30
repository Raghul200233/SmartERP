import { useEffect } from 'react';
import { useMainStore } from '../store/mainStore';
import { eventBus } from '../utils/eventBus';
import { dashboardService } from '../services/dashboard.service';
import { voucherService } from '../services/voucher.service';
import { stockItemService } from '../services/stock.service';
import { ledgerService } from '../services/ledger.service';
import { customerService } from '../services/customer.service';
import { supplierService } from '../services/supplier.service';

export const useDataSync = (companyId) => {
  const { 
    updateDashboard, updateStock, addVoucher, addLedger, 
    addCustomer, addSupplier, updateStockItem, setLoading 
  } = useMainStore();

  // Fetch all data on initial load
  useEffect(() => {
    if (companyId) {
      fetchAllData();
    }
  }, [companyId]);

  // Listen for real-time events
  useEffect(() => {
    const unsubscribeVoucher = eventBus.subscribe('VOUCHER_CREATED', handleVoucherCreated);
    const unsubscribeStock = eventBus.subscribe('STOCK_UPDATED', handleStockUpdated);
    const unsubscribeLedger = eventBus.subscribe('LEDGER_CREATED', handleLedgerCreated);
    const unsubscribeCustomer = eventBus.subscribe('CUSTOMER_CREATED', handleCustomerCreated);
    const unsubscribeSupplier = eventBus.subscribe('SUPPLIER_CREATED', handleSupplierCreated);

    return () => {
      unsubscribeVoucher();
      unsubscribeStock();
      unsubscribeLedger();
      unsubscribeCustomer();
      unsubscribeSupplier();
    };
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all data in parallel
      const [
        dashboardData,
        voucherData,
        stockData,
        ledgerData,
        customerData,
        supplierData
      ] = await Promise.all([
        fetchDashboard(),
        fetchVouchers(),
        fetchStock(),
        fetchLedgers(),
        fetchCustomers(),
        fetchSuppliers()
      ]);

      updateDashboard(dashboardData);
      // Update other stores
    } catch (error) {
      console.error('Error fetching all data:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const data = await dashboardService.getOverview(companyId);
      return data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      return {};
    }
  };

  const fetchVouchers = async () => {
    try {
      const response = await voucherService.getAll(companyId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      return [];
    }
  };

  const fetchStock = async () => {
    try {
      const response = await stockItemService.getAll(companyId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching stock:', error);
      return [];
    }
  };

  const fetchLedgers = async () => {
    try {
      const response = await ledgerService.getAll(companyId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      return [];
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerService.getAll(companyId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getAll(companyId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  };

  // Event handlers
  const handleVoucherCreated = (voucher) => {
    addVoucher(voucher);
    
    // Update dashboard based on voucher type
    if (voucher.voucher_type === 'SALES') {
      updateDashboard({
        todaySales: (useMainStore.getState().dashboard.todaySales || 0) + voucher.amount,
        todayOrders: (useMainStore.getState().dashboard.todayOrders || 0) + 1
      });
    } else if (voucher.voucher_type === 'PURCHASE') {
      updateDashboard({
        todayPurchases: (useMainStore.getState().dashboard.todayPurchases || 0) + voucher.amount,
        todayPurchaseOrders: (useMainStore.getState().dashboard.todayPurchaseOrders || 0) + 1
      });
    }
  };

  const handleStockUpdated = (item) => {
    updateStockItem(item.id, item);
  };

  const handleLedgerCreated = (ledger) => {
    addLedger(ledger);
  };

  const handleCustomerCreated = (customer) => {
    addCustomer(customer);
    updateDashboard({
      totalCustomers: (useMainStore.getState().dashboard.totalCustomers || 0) + 1
    });
  };

  const handleSupplierCreated = (supplier) => {
    addSupplier(supplier);
  };

  // Manual refresh function
  const refreshAll = () => {
    fetchAllData();
  };

  return { refreshAll };
};