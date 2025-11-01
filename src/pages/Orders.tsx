import { useEffect, useState } from 'react';
import { Printer, Search, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { db, type OrderWithItems } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { InvoiceDialog } from '@/components/InvoiceDialog';
import { EditOrderDialog } from '@/components/EditOrderDialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { getCurrentUser, isManager } from '@/lib/auth';

interface StoreSettings {
  currency: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  currency: 'AED',
};

export function Orders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const userIsManager = isManager(currentUser);

  useEffect(() => {
    loadSettings();
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setSettings({ currency: data.currency || 'AED' });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${settings.currency} ${amount.toFixed(2)}`;
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('created_at', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const ordersWithItems = await Promise.all(
        ordersSnapshot.docs.map(async (orderDoc) => {
          const orderData = { id: orderDoc.id, ...orderDoc.data() };
          
          // Fetch order items for this order
          const itemsQuery = query(
            collection(db, 'order_items'),
            where('order_id', '==', orderDoc.id)
          );
          const itemsSnapshot = await getDocs(itemsQuery);
          const items = itemsSnapshot.docs.map(itemDoc => ({
            id: itemDoc.id,
            ...itemDoc.data()
          }));
          
          return {
            ...orderData,
            order_items: items
          } as OrderWithItems;
        })
      );
      
      setOrders(ordersWithItems);
    } catch (error: any) {
      toast({
        title: 'Error loading orders',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(order => {
        const searchLower = searchQuery.toLowerCase();
        return (
          order.id.toLowerCase().includes(searchLower) ||
          order.order_items.some(item => 
            item.product_name.toLowerCase().includes(searchLower)
          )
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    // Apply payment mode filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_mode === paymentFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        payment_status: newStatus,
      });
      
      toast({
        title: 'Status updated',
        description: 'Order status has been updated successfully',
      });
      
      loadOrders();
    } catch (error: any) {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


  const handleViewInvoice = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
  };

  const handleEditOrder = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  const handlePrint = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
    // Trigger print after a short delay to allow dialog to open
    setTimeout(() => {
      const printButton = document.querySelector('[data-print-invoice]') as HTMLButtonElement;
      if (printButton) {
        printButton.click();
      }
    }, 500);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">View and manage all customer orders</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c7a956]"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                {orders.length === 0 ? 'No orders yet' : 'No orders found'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                {orders.length === 0 
                  ? 'Orders will appear here once customers place them' 
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap hidden sm:table-cell">Time</TableHead>
                    <TableHead className="whitespace-nowrap">Items</TableHead>
                    <TableHead className="whitespace-nowrap hidden lg:table-cell">Staff</TableHead>
                    <TableHead className="whitespace-nowrap hidden md:table-cell">Payment</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-medium whitespace-nowrap">
                            {format(new Date(order.created_at), 'MMM dd')}
                          </span>
                          <span className="text-xs text-gray-500 sm:hidden">
                            {format(new Date(order.created_at), 'hh:mm a')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 hidden sm:table-cell">
                        <span className="font-medium text-xs text-gray-500 whitespace-nowrap">
                          {format(new Date(order.created_at), 'hh:mm a')}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex flex-col min-w-[100px]">
                          <span className="font-medium text-sm">{order.order_items.length} items</span>
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">
                            {order.order_items.map(item => item.product_name).join(', ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 hidden lg:table-cell">
                        <span className="font-medium text-sm whitespace-nowrap">
                          {order.staff_name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="font-normal text-xs whitespace-nowrap">
                          {order.payment_mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.payment_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">
                              <span className="text-green-700 text-xs sm:text-sm">Paid</span>
                            </SelectItem>
                            <SelectItem value="Pending">
                              <span className="text-yellow-700 text-xs sm:text-sm">Pending</span>
                            </SelectItem>
                            <SelectItem value="Cancelled">
                              <span className="text-red-700 text-xs sm:text-sm">Cancelled</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm whitespace-nowrap">
                        {formatCurrency(Number(order.total))}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {userIsManager && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOrder(order)}
                              title="Edit Order"
                              className="h-8 w-8 p-0 text-black hover:text-black hover:bg-[#f8f1d8]"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInvoice(order)}
                            title="View Details"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrint(order)}
                            title="Print Invoice"
                            className="h-8 w-8 p-0"
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

      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        order={selectedOrder}
      />

      <EditOrderDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={loadOrders}
        order={selectedOrder}
        currencySymbol={settings.currency}
      />
    </div>
  );
}
