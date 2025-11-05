import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Archive as ArchiveIcon, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getArchivedOrdersByDate,
  getArchiveMetadata,
  getAvailableArchiveDates,
} from '@/lib/archiveSystem';
import { InvoiceDialog } from '@/components/InvoiceDialog';

export function Archive() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [archivedOrders, setArchivedOrders] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadArchivedData(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableDates = async () => {
    try {
      const dates = await getAvailableArchiveDates();
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
  };

  const loadArchivedData = async (date: Date) => {
    setLoading(true);
    try {
      const [orders, meta] = await Promise.all([
        getArchivedOrdersByDate(date),
        getArchiveMetadata(date),
      ]);

      setArchivedOrders(orders);
      setMetadata(meta);
    } catch (error) {
      console.error('Error loading archived data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (order: any) => {
    setSelectedOrder(order);
    setInvoiceDialogOpen(true);
  };

  const exportToCSV = () => {
    if (archivedOrders.length === 0) return;

    const headers = ['Order ID', 'Date', 'Time', 'Customer', 'Staff', 'Payment Method', 'Status', 'Items', 'Subtotal', 'Tax', 'Total'];
    const rows = archivedOrders.map((order) => [
      order.original_order_id,
      format(new Date(order.created_at), 'dd/MM/yyyy'),
      format(new Date(order.created_at), 'HH:mm'),
      order.customer_name || 'Walk-in',
      order.staff_name || 'Unknown',
      order.payment_mode || 'N/A',
      order.payment_status,
      order.order_items?.length || 0,
      Number(order.subtotal).toFixed(2),
      Number(order.tax).toFixed(2),
      Number(order.total).toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archived-orders-${format(selectedDate || new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ArchiveIcon className="w-8 h-8 text-[#c7a956]" />
            Order Archive
          </h1>
          <p className="text-gray-500 mt-1">View historical orders by date</p>
        </div>
        {archivedOrders.length > 0 && (
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </Button>
        )}
      </div>

      {/* Date Selector and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return !availableDates.includes(dateStr) || date > new Date();
                  }}
                />
              </PopoverContent>
            </Popover>

            {availableDates.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Available Archives:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {availableDates.slice(0, 10).map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(new Date(date))}
                      className={cn(
                        'w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100',
                        format(selectedDate || new Date(), 'yyyy-MM-dd') === date && 'bg-[#c7a956] text-white hover:bg-[#b8964a]'
                      )}
                    >
                      {format(new Date(date), 'MMM dd, yyyy')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {metadata && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-[#c7a956]">{metadata.totalOrders}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Archived on {format(new Date(metadata.archivedAt), 'PPP')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {formatCurrency(metadata.totalRevenue)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  For {format(new Date(metadata.archiveDate), 'MMMM dd, yyyy')}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Archived Orders
            {selectedDate && ` - ${format(selectedDate, 'MMMM dd, yyyy')}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c7a956]"></div>
            </div>
          ) : archivedOrders.length === 0 ? (
            <div className="text-center py-12">
              <ArchiveIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No archived orders found for this date
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Select a date with available archives from the list
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.original_order_id?.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(order.created_at), 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(order.created_at), 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>{order.customer_name || 'Walk-in'}</TableCell>
                      <TableCell>{order.staff_name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.payment_mode || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.payment_status === 'Paid'
                              ? 'default'
                              : order.payment_status === 'Pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.order_items?.length || 0}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(Number(order.total))}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewInvoice(order)}
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
