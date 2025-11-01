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
  logo: string;
  companyName: string;
  storeName: string;
  storeEmail: string;
  storeAddress: string;
  storePhone: string;
  trnCode: string;
  staffName: string;
  instagramHandle: string;
  currency: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  logo: 'JAMES',
  companyName: 'JAMES CAFE LTD',
  storeName: 'InventoryPro',
  storeEmail: 'admin@store.com',
  storeAddress: 'Shams Boutique - Al Reem Island - Abu Dhabi',
  storePhone: '028869949',
  trnCode: '100569844200003',
  staffName: 'Daniel',
  instagramHandle: '@jamescafe.ae',
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
          logo: data.logo || DEFAULT_SETTINGS.logo,
          companyName: data.companyName || DEFAULT_SETTINGS.companyName,
          storeName: data.storeName || DEFAULT_SETTINGS.storeName,
          storeEmail: data.storeEmail || DEFAULT_SETTINGS.storeEmail,
          storeAddress: data.storeAddress || DEFAULT_SETTINGS.storeAddress,
          storePhone: data.storePhone || DEFAULT_SETTINGS.storePhone,
          trnCode: data.trnCode || DEFAULT_SETTINGS.trnCode,
          staffName: data.staffName || DEFAULT_SETTINGS.staffName,
          instagramHandle: data.instagramHandle || DEFAULT_SETTINGS.instagramHandle,
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

    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 10px;
              max-width: 300px;
              margin: 0 auto;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .store-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .store-details {
              font-size: 10px;
              line-height: 1.3;
            }
            .divider {
              border-bottom: 1px solid #000;
              margin: 10px 0;
            }
            .divider-dashed {
              border-bottom: 1px dashed #000;
              margin: 10px 0;
            }
            .invoice-title {
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin: 10px 0;
            }
            .dine-in {
              text-align: center;
              font-size: 11px;
              margin-bottom: 5px;
            }
            .table-info {
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 10px;
            }
            .order-details {
              font-size: 10px;
              margin-bottom: 10px;
            }
            .order-row {
              display: flex;
              justify-content: space-between;
            }
            .items-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              margin: 10px 0 5px 0;
              font-size: 11px;
            }
            .item-row {
              margin: 5px 0;
              font-size: 11px;
            }
            .item-name {
              margin-bottom: 2px;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              padding-left: 10px;
            }
            .totals {
              margin-top: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 11px;
            }
            .grand-total {
              font-weight: bold;
              font-size: 13px;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #000;
            }
            .tax-details {
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 10px;
              font-size: 10px;
            }
            .tax-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
              font-size: 11px;
            }
            .thank-you {
              font-weight: bold;
              margin-bottom: 5px;
            }
            @media print {
              body {
                padding: 5px;
              }
              @page {
                size: 80mm auto;
                margin: 0;
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice #{order.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>
            Order details for {order.customer_name}
          </DialogDescription>
        </DialogHeader>

        {/* Hidden print content - Thermal Receipt Style */}
        <div id="invoice-print-content" style={{ display: 'none' }}>
          <div className="header">
            <div className="store-name">{settings.logo}</div>
            <div className="store-details">
              {settings.companyName}<br />
              {settings.storeAddress}<br />
              TRN {settings.trnCode}
            </div>
          </div>

          <div className="divider"></div>
          
          <div className="invoice-title">TAX INVOICE</div>
          
          <div className="dine-in">DINE-IN</div>
          
          <div className="table-info">TABLE 0</div>
          
          <div className="order-details">
            <div className="order-row">
              <span>Number of Covers: 1</span>
              <span>Staff: {settings.staffName}</span>
            </div>
            <div className="order-row">
              <span>{format(new Date(order.created_at), 'dd-MMM-yyyy')}</span>
              <span>{format(new Date(order.created_at), 'hh:mm a')}</span>
            </div>
          </div>

          <div className="divider-dashed"></div>

          <div className="items-header">
            <span>Qty</span>
            <span style={{ flex: 1, paddingLeft: '20px' }}>Item</span>
            <span>Price</span>
          </div>

          <div className="divider-dashed"></div>

          {order.order_items.map((item) => (
            <div key={item.id} className="item-row">
              <div className="item-details">
                <span>{item.quantity}</span>
                <span style={{ flex: 1, paddingLeft: '10px' }}>{item.product_name}</span>
                <span>{Number(item.total).toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div className="totals">
            <div className="total-row">
              <span>Sub Total</span>
              <span>{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>{settings.currency} {Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="tax-details">
            <div className="tax-row">
              <span>Net Amt</span>
              <span>Tax</span>
              <span>Tax Amt</span>
              <span>Total</span>
            </div>
            <div className="tax-row">
              <span>{Number(order.subtotal).toFixed(2)}</span>
              <span>VAT(5.00%)</span>
              <span>{Number(order.tax).toFixed(2)}</span>
              <span>{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="footer">
            <div className="thank-you">Thank you</div>
            <div>Please follow us on Instagram</div>
            <div>{settings.instagramHandle}</div>
          </div>
        </div>

        {/* Visible preview content - Receipt Style */}
        <div className="py-4 max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-4 pb-3 border-b-2 border-dashed">
            <h2 className="text-xl font-bold text-gray-900">{settings.logo}</h2>
            <p className="text-xs text-gray-700 font-semibold mt-1">{settings.companyName}</p>
            <p className="text-xs text-gray-600 mt-1">{settings.storeAddress}</p>
            <p className="text-xs text-gray-600">TRN {settings.trnCode}</p>
          </div>

          <div className="border-t-2 border-gray-900 my-3"></div>

          {/* Invoice Title */}
          <div className="text-center font-bold text-lg mb-2">TAX INVOICE</div>
          <div className="text-center text-sm mb-1">DINE-IN</div>
          <div className="text-center font-bold text-lg mb-3">TABLE 0</div>

          {/* Order Details */}
          <div className="text-xs mb-3">
            <div className="flex justify-between mb-1">
              <span>Number of Covers: 1</span>
              <span>Staff: {settings.staffName}</span>
            </div>
            <div className="flex justify-between">
              <span>{format(new Date(order.created_at), 'dd-MMM-yyyy')}</span>
              <span>{format(new Date(order.created_at), 'hh:mm a')}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Items Header */}
          <div className="flex justify-between font-semibold text-xs mb-2">
            <span className="w-8">Qty</span>
            <span className="flex-1 px-4">Item</span>
            <span className="w-16 text-right">Price</span>
          </div>

          <div className="border-t border-dashed border-gray-400 mb-2"></div>

          {/* Items */}
          {order.order_items.map((item) => (
            <div key={item.id} className="text-xs mb-2">
              <div className="flex justify-between">
                <span className="w-8">{item.quantity}</span>
                <span className="flex-1 px-4">{item.product_name}</span>
                <span className="w-16 text-right font-medium">{Number(item.total).toFixed(2)}</span>
              </div>
            </div>
          ))}

          {/* Totals */}
          <div className="border-t-2 border-gray-900 mt-3 pt-3">
            <div className="flex justify-between text-sm mb-2">
              <span>Sub Total</span>
              <span className="font-medium">{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t-2 border-gray-900 pt-2">
              <span>Total</span>
              <span>{settings.currency} {Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Tax Details */}
          <div className="border-t border-dashed border-gray-400 mt-3 pt-3 text-xs">
            <div className="grid grid-cols-4 gap-2 font-semibold mb-1">
              <span>Net Amt</span>
              <span>Tax</span>
              <span>Tax Amt</span>
              <span className="text-right">Total</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <span>{Number(order.subtotal).toFixed(2)}</span>
              <span>VAT(5.00%)</span>
              <span>{Number(order.tax).toFixed(2)}</span>
              <span className="text-right">{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400 text-xs">
            <p className="font-bold mb-1">Thank you</p>
            <p>Please follow us on Instagram</p>
            <p>{settings.instagramHandle}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint} data-print-invoice className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
