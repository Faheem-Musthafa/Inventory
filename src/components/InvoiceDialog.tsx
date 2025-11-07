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
  invoiceFooter: string;
  showInstagram: boolean;
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
  invoiceFooter: 'Thank you for your business!\nPlease visit again',
  showInstagram: true,
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
          invoiceFooter: data.invoiceFooter || DEFAULT_SETTINGS.invoiceFooter,
          showInstagram: data.showInstagram !== undefined ? data.showInstagram : DEFAULT_SETTINGS.showInstagram,
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

    const printWindow = window.open('', '', 'width=302,height=718');
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
              width: 80mm;
              max-width: 80mm;
              height: 190mm;
              padding: 3mm;
              margin: 0 auto;
              font-size: 9px;
              line-height: 1.2;
              overflow: hidden;
            }
            .header {
              text-align: center;
              margin-bottom: 3mm;
              border-bottom: 1px dashed #000;
              padding-bottom: 2mm;
            }
            .store-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 1mm;
              letter-spacing: 1px;
            }
            .store-details {
              font-size: 8px;
              line-height: 1.3;
            }
            .text-underline {
              text-decoration: underline;
              text-decoration-color: gray;
              text-decoration-thickness: 0.5px;
              text-underline-offset: 1px;
            }
            .divider {
              border-bottom: 1px solid #000;
              margin: 2mm 0;
            }
            .divider-dashed {
              border-bottom: 1px dashed #000;
              margin: 2mm 0;
            }
            .invoice-title {
              text-align: center;
              font-weight: bold;
              font-size: 11px;
              margin: 2mm 0;
            }
            .dine-in {
              text-align: center;
              font-size: 9px;
              margin-bottom: 1mm;
            }
            .table-info {
              text-align: center;
              font-weight: bold;
              font-size: 11px;
              margin-bottom: 2mm;
            }
            .order-details {
              font-size: 8px;
              margin-bottom: 2mm;
            }
            .order-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
            }
            .items-header {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              margin: 2mm 0 1mm 0;
              font-size: 9px;
            }
            .item-row {
              margin: 1mm 0;
              font-size: 9px;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .item-qty {
              width: 12mm;
              flex-shrink: 0;
            }
            .item-name {
              flex: 1;
              padding: 0 2mm;
              word-wrap: break-word;
              overflow-wrap: break-word;
              max-width: 45mm;
            }
            .item-price {
              width: 15mm;
              text-align: right;
              flex-shrink: 0;
            }
            .totals {
              margin-top: 2mm;
              border-top: 1px solid #000;
              padding-top: 2mm;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 1mm 0;
              font-size: 9px;
            }
            .grand-total {
              font-weight: bold;
              font-size: 11px;
              margin-top: 2mm;
              padding-top: 2mm;
              border-top: 1px solid #000;
            }
            .tax-details {
              margin-top: 2mm;
              border-top: 1px dashed #000;
              padding-top: 2mm;
              font-size: 7px;
            }
            .tax-row {
              display: flex;
              justify-content: space-between;
              margin: 1mm 0;
            }
            .tax-row span {
              flex: 1;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 3mm;
              border-top: 1px dashed #000;
              padding-top: 2mm;
              font-size: 8px;
            }
            .thank-you {
              font-weight: bold;
              margin-bottom: 1mm;
            }
            @media print {
              body {
                padding: 3mm;
              }
              @page {
                size: 80mm 190mm;
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
        <div id="invoice-print-content" style={{ display: 'none', color: '#' }}>
          <div className="header">
            <div className="store-name">{settings.logo}</div>
            <div className="store-details">
              {settings.companyName}<br />
              {settings.storeAddress}<br />
              <span className='text-underline'>{settings.storePhone}</span><br />
              TRN {settings.trnCode}
            </div>
          </div>

          <div className="divider"></div>
          
          <div className="invoice-title">TAX INVOICE</div>
          
          <div className="dine-in">DINE-IN</div>
          
          <div className="table-info">
            {order.table_number ? `TABLE ${order.table_number}` : 'TAKEAWAY'}
          </div>
          
          <div className="order-details" style={{ fontSize: '8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1mm' }}>{order.id.slice(0, 6)}</div>
          </div>
          
          <div className="order-details">
            <div className="order-row">
              <span>Number of Covers: {order.covers || 1}</span>
              <span>Staff: {order.staff_name || settings.staffName}</span>
            </div>
            <div className="order-row">
              <span>{format(new Date(order.created_at), 'dd-MMM-yyyy')}</span>
              <span>{format(new Date(order.created_at), 'hh:mm a')}</span>
            </div>
          </div>

          <div className="divider-dashed"></div>

          <div className="items-header">
            <span style={{ width: '12mm' }}>Qty</span>
            <span style={{ flex: 1, paddingLeft: '2mm' }}>Item</span>
            <span style={{ width: '15mm', textAlign: 'right' }}>Price</span>
          </div>

          <div className="divider-dashed"></div>

          {order.order_items.map((item) => (
            <div key={item.id} className="item-row">
              <div className="item-details">
                <span className="item-qty">{item.quantity}</span>
                <span className="item-name">{item.product_name}</span>
                <span className="item-price">{Number(item.total).toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div className="divider-dashed"></div>

          <div className="totals">
            <div className="total-row" style={{ fontSize: '10px', textAlign: 'right', marginBottom: '1mm' }}>
              <span>Sub Total</span>
              <span>{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="total-row grand-total" style={{ textAlign: 'right' }}>
              <span>Total</span>
              <span>{settings.currency} {Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="divider-dashed"></div>

          <div className="tax-details">
            <div className="tax-row" style={{ fontSize: '8px' }}>
              <span style={{ textAlign: 'left' }}>Net Amt</span>
              <span>Tax</span>
              <span>Tax Amt</span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>
            <div className="tax-row" style={{ fontSize: '8px' }}>
              <span style={{ textAlign: 'left' }}>{Number(order.subtotal).toFixed(2)}</span>
              <span>VAT(5.00%)</span>
              <span>{Number(order.tax).toFixed(2)}</span>
              <span style={{ textAlign: 'right' }}>{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="footer">
            {settings.invoiceFooter.split('\n').map((line, index) => (
              <div key={index} className={index === 0 ? 'thank-you' : ''}>{line}</div>
            ))}
            {settings.showInstagram && (
              <>
                <div>Please follow us on Instagram</div>
                <div>{settings.instagramHandle}</div>
              </>
            )}
          </div>
        </div>

        {/* Visible preview content - Receipt Style */}
        <div className="py-4 max-w-sm mx-auto">
          {/* Header */}
          <div className="text-center mb-4 pb-3 border-b-2 border-dashed">
            <h2 className="text-2xl font-bold text-[#c7a956]">{settings.logo}</h2>
            <p className="text-xs text-gray-700 font-semibold mt-1">{settings.companyName}</p>
            <p className="text-xs text-gray-600 mt-1">{settings.storeAddress}</p>
            <p className="text-xs underline underline-offset-3 text-gray-600 mt-1">{settings.storePhone}</p>
            <p className="text-xs text-gray-600">TRN {settings.trnCode}</p>
          </div>

          <div className="border-t-2 border-gray-900 my-3"></div>

          {/* Invoice Title */}
          <div className="text-center font-bold text-lg mb-2">TAX INVOICE</div>
          <div className="text-center text-sm mb-1">DINE-IN</div>
          <div className="text-center font-bold text-lg mb-3">
            {order.table_number ? `TABLE ${order.table_number}` : 'TAKEAWAY'}
          </div>

          {/* Order ID */}
          <div className="text-center text-xs text-gray-600 mb-3">{order.id.slice(0, 6)}</div>

          {/* Order Details */}
          <div className="text-xs mb-3">
            <div className="flex justify-between mb-1">
              <span>Number of Covers: {order.covers || 1}</span>
              <span>Staff: {order.staff_name || settings.staffName}</span>
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
          <div className="border-t border-dashed border-gray-400 mt-3 pt-3">
            <div className="flex justify-end text-sm mb-2">
              <div className="flex gap-8">
                <span>Sub Total</span>
                <span className="font-medium">{Number(order.subtotal).toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-end font-bold text-lg">
              <div className="flex gap-8">
                <span>Total</span>
                <span>{settings.currency} {Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tax Breakdown Table */}
          <div className="border-t border-dashed border-gray-400 mt-3 pt-3">
            <div className="text-xs">
              <div className="flex justify-between mb-2 font-semibold">
                <span className="flex-1 text-left">Net Amt</span>
                <span className="flex-1 text-center">Tax</span>
                <span className="flex-1 text-center">Tax Amt</span>
                <span className="flex-1 text-right">Total</span>
              </div>
              <div className="flex justify-between">
                <span className="flex-1 text-left">{Number(order.subtotal).toFixed(2)}</span>
                <span className="flex-1 text-center">VAT(5.00%)</span>
                <span className="flex-1 text-center">{Number(order.tax).toFixed(2)}</span>
                <span className="flex-1 text-right">{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400 text-xs">
            {settings.invoiceFooter.split('\n').map((line, index) => (
              <p key={index} className={index === 0 ? 'font-bold mb-1' : 'mb-1'}>{line}</p>
            ))}
            {settings.showInstagram && (
              <>
                <p>Please follow us on Instagram</p>
                <p>{settings.instagramHandle}</p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint} data-print-invoice className="bg-[#c7a956] hover:bg-[#dcb341]">
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
