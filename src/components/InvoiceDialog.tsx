import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { db, type OrderWithItems } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  order: OrderWithItems | null;
}

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storeAddress: string;
  storePhone: string;
  currency: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'InventoryPro',
  storeEmail: 'admin@store.com',
  storeAddress: '123 Business Street, City, State 12345',
  storePhone: '(555) 123-4567',
  currency: 'AED',
};

export function InvoiceDialog({ open, onClose, order }: InvoiceDialogProps) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'store');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          storeName: data.storeName || DEFAULT_SETTINGS.storeName,
          storeEmail: data.storeEmail || DEFAULT_SETTINGS.storeEmail,
          storeAddress: data.storeAddress || DEFAULT_SETTINGS.storeAddress,
          storePhone: data.storePhone || DEFAULT_SETTINGS.storePhone,
          currency: data.currency || DEFAULT_SETTINGS.currency,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  if (!order) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print-content');
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id.slice(0, 8)}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #111827;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .invoice-number {
              color: #6B7280;
              font-size: 14px;
            }
            .store-info {
              text-align: right;
            }
            .store-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .store-details {
              color: #6B7280;
              font-size: 14px;
              line-height: 1.6;
            }
            .billing-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 12px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            .customer-name {
              font-weight: 500;
            }
            .invoice-date-section {
              text-align: right;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
              border: 1px solid #E5E7EB;
            }
            .items-table thead {
              background-color: #F9FAFB;
            }
            .items-table th {
              padding: 12px;
              text-align: left;
              font-size: 14px;
              font-weight: 600;
              color: #374151;
              border-bottom: 1px solid #E5E7EB;
            }
            .items-table td {
              padding: 12px;
              font-size: 14px;
              border-bottom: 1px solid #E5E7EB;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 40px;
            }
            .totals-box {
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .total-row.final {
              border-top: 2px solid #E5E7EB;
              padding-top: 12px;
              font-size: 18px;
              font-weight: bold;
            }
            .footer {
              border-top: 1px solid #E5E7EB;
              padding-top: 32px;
              text-align: center;
            }
            .footer-title {
              font-size: 16px;
              font-weight: 500;
              margin-bottom: 8px;
            }
            .footer-text {
              color: #6B7280;
              font-size: 14px;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatCurrency = (amount: number) => {
    return `${settings.currency} ${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice #{order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>
            Order details for {order.customer_name}
          </DialogDescription>
        </DialogHeader>

        {/* Hidden print content */}
        <div id="invoice-print-content" style={{ display: 'none' }}>
          <div className="invoice-header">
            <div>
              <div className="invoice-title">INVOICE</div>
              <div className="invoice-number">Order #{order.id.slice(0, 8)}</div>
            </div>
            <div className="store-info">
              <div className="store-name">{settings.storeName}</div>
              <div className="store-details">
                {settings.storeAddress}<br />
                Phone: {settings.storePhone}<br />
                Email: {settings.storeEmail}
              </div>
            </div>
          </div>

          <div className="billing-section">
            <div>
              <div className="section-title">BILL TO:</div>
              <div className="customer-name">{order.customer_name}</div>
            </div>
            <div className="invoice-date-section">
              <div className="section-title">INVOICE DATE:</div>
              <div>{format(new Date(order.created_at), 'MMM dd, yyyy')}</div>
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#6B7280' }}>
                Payment: {order.payment_mode}
              </div>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(Number(item.price))}</td>
                  <td className="text-right" style={{ fontWeight: '500' }}>
                    {formatCurrency(Number(item.total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-section">
            <div className="totals-box">
              <div className="total-row">
                <span>Subtotal</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="total-row">
                <span>Vat</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(Number(order.tax))}</span>
              </div>
              <div className="total-row final">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <div className="footer">
            <div className="footer-title">Thank you for your business!</div>
            <div className="footer-text">
              For questions about this invoice, please contact us at {settings.storeEmail}
            </div>
          </div>
        </div>

        {/* Visible preview content */}
        <div className="py-4">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">{settings.storeName}</h2>
              <p className="text-sm text-gray-600 mt-1">{settings.storeAddress}</p>
              <p className="text-sm text-gray-600">Phone: {settings.storePhone}</p>
              <p className="text-sm text-gray-600">Email: {settings.storeEmail}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">BILL TO:</h3>
              <p className="font-medium text-gray-900">{order.customer_name}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">INVOICE DATE:</h3>
              <p className="text-gray-900">{format(new Date(order.created_at), 'MMM dd, yyyy')}</p>
              <p className="text-sm text-gray-600 mt-2">Payment: {order.payment_mode}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Item
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.order_items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(Number(item.price))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(Number(item.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vat</span>
                <span className="font-medium">{formatCurrency(Number(order.tax))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">Thank you for your business!</p>
            <p className="text-sm text-gray-600">
              For questions about this invoice, please contact us at {settings.storeEmail}
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint} data-print-invoice>
              <Printer className="w-4 h-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
