// Central event bus for cross-component communication
class EventBus {
  constructor() {
    this.events = {};
  }

  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }

  // Specific events
  emitVoucherCreated(voucher) {
    this.emit('VOUCHER_CREATED', voucher);
  }

  emitStockUpdated(item) {
    this.emit('STOCK_UPDATED', item);
  }

  emitLedgerCreated(ledger) {
    this.emit('LEDGER_CREATED', ledger);
  }

  emitCustomerCreated(customer) {
    this.emit('CUSTOMER_CREATED', customer);
  }

  emitSupplierCreated(supplier) {
    this.emit('SUPPLIER_CREATED', supplier);
  }
}

export const eventBus = new EventBus();