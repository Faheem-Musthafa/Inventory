import { useEffect, useState } from 'react';
import { Plus, Eye, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase, type OrderWithItems } from '@/lib/supabase';
import { CreateOrderDialog } from '@/components/CreateOrderDialog';
import { InvoiceDialog } from '@/components/InvoiceDialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function Orders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading orders',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setOrders((data as OrderWithItems[]) || []);
    }
    setLoading(false);
  };

  const handleViewInvoice = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    loadOrders();
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage customer orders and invoices</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-4">Create your first order to get started</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-gray-600">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">{order.customer_name}</TableCell>
                      <TableCell className="text-gray-600">
                        {order.order_items.length} items
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                          {order.payment_mode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium">
                          {order.payment_status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(order.total).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setTimeout(() => window.print(), 100);
                            }}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateOrderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
