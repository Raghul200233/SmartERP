import React, { useRef } from 'react';
import { X, Printer, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { invoiceService } from '../../services/invoice.service';
import { useCompanyStore } from '../../store/companyStore';

export const InvoicePreview = ({ invoice, onClose }) => {
  const { currentCompany } = useCompanyStore();
  const [downloading, setDownloading] = React.useState(false);
  const printRef = useRef();

  if (!invoice) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const pdfBlob = await invoiceService.downloadPDF(currentCompany.id, invoice.id);
      
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Invoice Preview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {invoice.invoice_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Download PDF"
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-gray-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-8 print:p-4" ref={printRef}>
          {/* Invoice Content */}
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {invoice.company?.name || 'SmartERP'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invoice.company?.address || ''}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GST: {invoice.company?.gst_number || 'N/A'} | Phone: {invoice.company?.mobile || 'N/A'}
              </p>
            </div>

            {/* Invoice Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {invoice.invoice_type === 'TAX_INVOICE' ? 'TAX INVOICE' : 
                 invoice.invoice_type === 'PROFORMA' ? 'PROFORMA INVOICE' :
                 invoice.invoice_type === 'QUOTATION' ? 'QUOTATION' : 'ESTIMATE'}
              </h2>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Invoice No</p>
                <p className="font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(invoice.date), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bill To</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {invoice.customers?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {invoice.customers?.address || ''}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                GST: {invoice.customers?.gst_number || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Phone: {invoice.customers?.mobile || 'N/A'}
              </p>
            </div>

            {/* Items Table */}
            <table className="w-full mb-6">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    GST%
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoice.invoice_items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      {item.stock_items?.name || 'Unknown'}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-gray-600 dark:text-gray-400">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="px-3 py-2 text-center text-sm text-gray-600 dark:text-gray-400">
                      {item.gst_percentage}%
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <td colSpan="4" className="px-3 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subtotal
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                </tr>
                {invoice.gst_amount > 0 && (
                  <tr>
                    <td colSpan="4" className="px-3 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      GST
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.gst_amount)}
                    </td>
                  </tr>
                )}
                {invoice.discount_amount > 0 && (
                  <tr>
                    <td colSpan="4" className="px-3 py-2 text-right text-sm font-medium text-red-600">
                      Discount
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-red-600">
                      -{formatCurrency(invoice.discount_amount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                  <td colSpan="4" className="px-3 py-2 text-right text-base font-bold text-gray-900 dark:text-white">
                    Grand Total
                  </td>
                  <td className="px-3 py-2 text-right text-base font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(invoice.net_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Terms */}
            {invoice.terms_conditions && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terms & Conditions</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {invoice.terms_conditions}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>Generated by SmartERP</p>
              <p>Printed on: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};