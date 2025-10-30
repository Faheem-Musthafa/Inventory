import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { type OrderWithItems } from '@/lib/supabase';
import { format } from 'date-fns';

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  order: OrderWithItems | null;
}

export function InvoiceDialog({ open, onClose, order }: InvoiceDialogProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto print:max-w-full">
        <div className="print:p-8">
          <div className="flex justify-between items-start mb-8 print:mb-12">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
              <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900">InventoryPro</h2>
              <p className="text-sm text-gray-600 mt-1">123 Business Street</p>
              <p className="text-sm text-gray-600">City, State 12345</p>
              <p className="text-sm text-gray-600">Phone: (555) 123-4567</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8 print:mb-12">
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

          <div className="border rounded-lg overflow-hidden mb-8 print:mb-12">
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
                      ${Number(item.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      ${Number(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8 print:mb-12">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 print:pt-12 text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">Thank you for your business!</p>
            <p className="text-sm text-gray-600">
              For questions about this invoice, please contact us at info@inventorypro.com
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6 print:hidden">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
