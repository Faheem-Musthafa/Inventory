import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, FileText, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db, type Product, type Order } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { generateSettlementReportPDF } from '@/lib/settlementReportGenerator';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StoreSettings {
  currency: string;
}

export function Reports() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number }>>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; sold: number; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(), // Automatically set to today's date
    to: undefined,
  });
  const [settings, setSettings] = useState<StoreSettings>({
    currency: 'AED',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadReports();
  }, [dateRange]);

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

  const loadReports = async () => {
    setLoading(true);

    try {
      const [ordersSnapshot, productsSnapshot, itemsSnapshot] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'order_items')),
      ]);

      let orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter out cancelled orders
      orders = orders.filter(order => order.payment_status !== 'Cancelled');

      // Filter orders by specific date if selected
      if (dateRange.from) {
        const selectedDate = startOfDay(dateRange.from);
        const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        
        orders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return isWithinInterval(orderDate, { start: selectedDate, end: endDate });
        });
      }

      // Filter items based on the filtered orders (excluding cancelled)
      const filteredOrderIds = new Set(orders.map(o => o.id));
      const filteredItems = items.filter((item: any) => filteredOrderIds.has(item.order_id));

      // Calculate total revenue - will be 0 if no orders in date range
      const totalRev = orders.length > 0 ? orders.reduce((sum, o) => sum + Number(o.total), 0) : 0;
      setTotalRevenue(totalRev);
      
      // Calculate total orders - will be 0 if no orders in date range
      setTotalOrders(orders.length);
      
      // Calculate total products - always show total products regardless of date
      setTotalProducts(products.length);
      
      // Calculate total items sold (from filtered items) - will be 0 if no items in date range
      const totalSold = filteredItems.length > 0 ? filteredItems.reduce((sum, item: any) => sum + Number(item.quantity || 0), 0) : 0;
      setTotalItemsSold(totalSold);

      // Category data based on sold items revenue (from filtered items) - will be empty if no items
      const categoryMap = new Map<string, number>();
      if (filteredItems.length > 0) {
        filteredItems.forEach((item: any) => {
          const product = products.find(p => p.id === item.product_id);
          if (product) {
            const current = categoryMap.get(product.category) || 0;
            categoryMap.set(product.category, current + Number(item.total));
          }
        });
      }

      const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));
      setCategoryData(catData);

      // Top products with quantity sold and revenue (from filtered items) - will be empty if no items
      const productMap = new Map<string, { sold: number; revenue: number }>();
      if (filteredItems.length > 0) {
        filteredItems.forEach((item: any) => {
          const current = productMap.get(item.product_name) || { sold: 0, revenue: 0 };
          productMap.set(item.product_name, {
            sold: current.sold + Number(item.quantity),
            revenue: current.revenue + Number(item.total)
          });
        });
      }

      const top = Array.from(productMap.entries())
        .map(([name, data]) => ({ name, sold: data.sold, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopProducts(top);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSettlementReport = async () => {
    try {
      // Use the current filtered date range
      const startDate = dateRange.from ? startOfDay(dateRange.from) : startOfDay(new Date());
      const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
      
      // Fetch orders for the date range
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      
      // Filter for selected date range and paid orders only
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: startDate, end: endDate }) && 
               order.payment_status === 'Paid';
      });
      
      if (filteredOrders.length === 0) {
        toast({
          title: 'No Data',
          description: 'No paid orders found for the selected date range',
          variant: 'destructive'
        });
        return;
      }

      // Fetch order items for detailed analysis
      const itemsSnapshot = await getDocs(collection(db, 'order_items'));
      const allItems = itemsSnapshot.docs.map(doc => doc.data());
      
      const filteredOrderIds = new Set(filteredOrders.map(o => o.id));
      const filteredItems = allItems.filter((item: any) => filteredOrderIds.has(item.order_id));

      // Fetch products for category information
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      const productMap = new Map(allProducts.map(p => [p.name, p]));
      
      // Calculate totals
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalCashSales = filteredOrders.filter(o => o.payment_mode === 'Cash').reduce((sum, o) => sum + Number(o.total), 0);
      const totalCardSales = filteredOrders.filter(o => o.payment_mode === 'Card').reduce((sum, o) => sum + Number(o.total), 0);
      const totalOnlineSales = filteredOrders.filter(o => o.payment_mode === 'Online').reduce((sum, o) => sum + Number(o.total), 0);
      const netSales = filteredOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);
      const taxCollected = filteredOrders.reduce((sum, o) => sum + Number(o.tax), 0);
      const totalItemsSold = filteredItems.reduce((sum, item: any) => sum + Number(item.quantity), 0);
      const averageOrderValue = totalRevenue / filteredOrders.length;
      
      const cashOrders = filteredOrders.filter(o => o.payment_mode === 'Cash').length;
      const cardOrders = filteredOrders.filter(o => o.payment_mode === 'Card').length;
      const onlineOrders = filteredOrders.filter(o => o.payment_mode === 'Online').length;

      // Top products
      const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
      filteredItems.forEach((item: any) => {
        const current = productSalesMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productSalesMap.set(item.product_name, {
          quantity: current.quantity + Number(item.quantity),
          revenue: current.revenue + Number(item.total)
        });
      });
      
      const topProducts = Array.from(productSalesMap.entries())
        .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Category breakdown
      const categoryMap = new Map<string, { revenue: number; itemsSold: number }>();
      filteredItems.forEach((item: any) => {
        const product = productMap.get(item.product_name);
        const category = product?.category || 'Uncategorized';
        const current = categoryMap.get(category) || { revenue: 0, itemsSold: 0 };
        categoryMap.set(category, {
          revenue: current.revenue + Number(item.total),
          itemsSold: current.itemsSold + Number(item.quantity)
        });
      });
      
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, revenue: data.revenue, itemsSold: data.itemsSold }))
        .sort((a, b) => b.revenue - a.revenue);

      // Staff performance
      const staffMap = new Map<string, { orders: number; revenue: number }>();
      filteredOrders.forEach(order => {
        const staffName = order.staff_name || 'Unknown';
        const current = staffMap.get(staffName) || { orders: 0, revenue: 0 };
        staffMap.set(staffName, {
          orders: current.orders + 1,
          revenue: current.revenue + Number(order.total)
        });
      });
      
      const staffPerformance = Array.from(staffMap.entries())
        .map(([staff, data]) => ({ 
          staff, 
          orders: data.orders, 
          revenue: data.revenue,
          averageOrderValue: data.revenue / data.orders
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Hourly breakdown
      const hourlyMap = new Map<string, { orders: number; revenue: number }>();
      filteredOrders.forEach(order => {
        const hour = format(new Date(order.created_at), 'HH:00');
        const current = hourlyMap.get(hour) || { orders: 0, revenue: 0 };
        hourlyMap.set(hour, {
          orders: current.orders + 1,
          revenue: current.revenue + Number(order.total)
        });
      });
      
      const hourlyBreakdown = Array.from(hourlyMap.entries())
        .map(([hour, data]) => ({ hour, orders: data.orders, revenue: data.revenue }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
      
      // Generate PDF
      generateSettlementReportPDF({
        date: startDate.toISOString(),
        orders: filteredOrders,
        totalCashSales,
        totalCardSales,
        totalOnlineSales,
        totalRevenue,
        taxCollected,
        netSales,
        totalOrders: filteredOrders.length,
        cashOrders,
        cardOrders,
        onlineOrders,
        totalItemsSold,
        averageOrderValue,
        topProducts,
        categoryBreakdown,
        staffPerformance,
        hourlyBreakdown
      }, settings.currency);
      
      toast({
        title: 'Settlement Report Generated',
        description: `Report for ${format(startDate, 'MMM dd, yyyy')} has been downloaded`,
      });
    } catch (error) {
      console.error('Error generating settlement report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate settlement report',
        variant: 'destructive'
      });
    }
  };

  const exportToCSV = async () => {
    try {
      // Use the current filtered date range
      const startDate = dateRange.from ? startOfDay(dateRange.from) : startOfDay(new Date());
      const endDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(new Date());
      
      // Fetch all data
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      
      // Filter for selected date range and paid orders only
      const filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: startDate, end: endDate }) && 
               order.payment_status === 'Paid';
      });
      
      if (filteredOrders.length === 0) {
        toast({
          title: 'No Data',
          description: 'No paid orders found for the selected date range',
          variant: 'destructive'
        });
        return;
      }

      // Fetch order items
      const itemsSnapshot = await getDocs(collection(db, 'order_items'));
      const allItems = itemsSnapshot.docs.map(doc => doc.data());
      
      const filteredOrderIds = new Set(filteredOrders.map(o => o.id));
      const filteredItems = allItems.filter((item: any) => filteredOrderIds.has(item.order_id));

      // Fetch products for category information
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      const productMap = new Map(allProducts.map(p => [p.name, p]));

      // Build accounting-focused CSV data
      let csvContent = '';
      
      // === ACCOUNTING SUMMARY ===
      const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalCashSales = filteredOrders.filter(o => o.payment_mode === 'Cash').reduce((sum, o) => sum + Number(o.total), 0);
      const totalCardSales = filteredOrders.filter(o => o.payment_mode === 'Card').reduce((sum, o) => sum + Number(o.total), 0);
      const totalOnlineSales = filteredOrders.filter(o => o.payment_mode === 'Online').reduce((sum, o) => sum + Number(o.total), 0);
      const netSales = filteredOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);
      const taxCollected = filteredOrders.reduce((sum, o) => sum + Number(o.tax), 0);
      const totalItemsSold = filteredItems.reduce((sum, item: any) => sum + Number(item.quantity), 0);

      csvContent += `FUDE Studio Dubai - Accounting Report\n`;
      csvContent += `Period: ${format(startDate, 'dd/MM/yyyy')}${dateRange.to ? ` to ${format(endDate, 'dd/MM/yyyy')}` : ''}\n`;
      csvContent += `Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n`;
      csvContent += `Currency: ${settings.currency}\n\n`;
      
      csvContent += `FINANCIAL SUMMARY\n`;
      csvContent += `Account,Debit (${settings.currency}),Credit (${settings.currency})\n`;
      csvContent += `Gross Sales,,${totalRevenue.toFixed(2)}\n`;
      csvContent += `Sales Tax Collected,,${taxCollected.toFixed(2)}\n`;
      csvContent += `Net Sales Revenue,,${netSales.toFixed(2)}\n`;
      csvContent += `Total Transactions,${filteredOrders.length},\n`;
      csvContent += `Total Units Sold,${totalItemsSold},\n\n`;

      // === PAYMENT RECONCILIATION ===
      csvContent += `PAYMENT RECONCILIATION\n`;
      csvContent += `Payment Method,Transaction Count,Amount (${settings.currency}),% of Total\n`;
      csvContent += `Cash Payments,${filteredOrders.filter(o => o.payment_mode === 'Cash').length},${totalCashSales.toFixed(2)},${((totalCashSales / totalRevenue) * 100).toFixed(2)}%\n`;
      csvContent += `Card Payments,${filteredOrders.filter(o => o.payment_mode === 'Card').length},${totalCardSales.toFixed(2)},${((totalCardSales / totalRevenue) * 100).toFixed(2)}%\n`;
      csvContent += `Online Payments,${filteredOrders.filter(o => o.payment_mode === 'Online').length},${totalOnlineSales.toFixed(2)},${((totalOnlineSales / totalRevenue) * 100).toFixed(2)}%\n`;
      csvContent += `TOTAL,${filteredOrders.length},${totalRevenue.toFixed(2)},100.00%\n\n`;
      
      // === CASH RECONCILIATION ===
      csvContent += `CASH DRAWER RECONCILIATION\n`;
      csvContent += `Description,Amount (${settings.currency})\n`;
      csvContent += `Opening Balance,0.00\n`;
      csvContent += `Cash Sales,${totalCashSales.toFixed(2)}\n`;
      csvContent += `Expected Cash,${totalCashSales.toFixed(2)}\n`;
      csvContent += `Actual Cash Counted,\n`;
      csvContent += `Difference (Over/Short),\n\n`;

      // === SALES LEDGER (TRANSACTION LOG) ===
      csvContent += `SALES LEDGER - TRANSACTION LOG\n`;
      csvContent += `Date,Time,Invoice No,Payment Method,Subtotal (${settings.currency}),Tax (${settings.currency}),Total (${settings.currency}),Staff,Status\n`;
      
      // Sort orders by date/time for ledger
      const sortedOrders = [...filteredOrders].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      sortedOrders.forEach(order => {
        const orderDate = new Date(order.created_at);
        csvContent += `${format(orderDate, 'dd/MM/yyyy')},${format(orderDate, 'HH:mm:ss')},${order.id},${order.payment_mode || 'N/A'},${Number(order.subtotal).toFixed(2)},${Number(order.tax).toFixed(2)},${Number(order.total).toFixed(2)},"${order.staff_name || 'Unknown'}",${order.payment_status}\n`;
      });
      csvContent += `\n`;
      
      csvContent += `LEDGER TOTALS\n`;
      csvContent += `Description,Amount (${settings.currency})\n`;
      csvContent += `Total Subtotal,${netSales.toFixed(2)}\n`;
      csvContent += `Total Tax,${taxCollected.toFixed(2)}\n`;
      csvContent += `Total Amount,${totalRevenue.toFixed(2)}\n\n`;

      // === REVENUE BY CATEGORY (For P&L) ===
      const categoryMap = new Map<string, { revenue: number; itemsSold: number; cost: number }>();
      filteredItems.forEach((item: any) => {
        const product = productMap.get(item.product_name);
        const category = product?.category || 'Uncategorized';
        const current = categoryMap.get(category) || { revenue: 0, itemsSold: 0, cost: 0 };
        const productCost = (product as any)?.cost || 0;
        categoryMap.set(category, {
          revenue: current.revenue + Number(item.total),
          itemsSold: current.itemsSold + Number(item.quantity),
          cost: current.cost + (Number(productCost) * Number(item.quantity))
        });
      });
      
      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ 
          category, 
          revenue: data.revenue, 
          itemsSold: data.itemsSold,
          cost: data.cost,
          grossProfit: data.revenue - data.cost
        }))
        .sort((a, b) => b.revenue - a.revenue);

      csvContent += `REVENUE BY CATEGORY\n`;
      csvContent += `Category,Units Sold,Revenue (${settings.currency}),COGS (${settings.currency}),Gross Profit (${settings.currency}),Margin %\n`;
      categoryBreakdown.forEach(cat => {
        const margin = cat.revenue > 0 ? ((cat.grossProfit / cat.revenue) * 100).toFixed(2) : '0.00';
        csvContent += `"${cat.category}",${cat.itemsSold},${cat.revenue.toFixed(2)},${cat.cost.toFixed(2)},${cat.grossProfit.toFixed(2)},${margin}%\n`;
      });
      const totalCost = categoryBreakdown.reduce((sum, cat) => sum + cat.cost, 0);
      const totalGrossProfit = totalRevenue - totalCost;
      csvContent += `TOTAL,${totalItemsSold},${totalRevenue.toFixed(2)},${totalCost.toFixed(2)},${totalGrossProfit.toFixed(2)},${((totalGrossProfit / totalRevenue) * 100).toFixed(2)}%\n\n`;

      // === INVENTORY SOLD (Stock Movement) ===
      const productSalesMap = new Map<string, { quantity: number; revenue: number; cost: number }>();
      filteredItems.forEach((item: any) => {
        const product = productMap.get(item.product_name);
        const current = productSalesMap.get(item.product_name) || { quantity: 0, revenue: 0, cost: 0 };
        const productCost = (product as any)?.cost || 0;
        productSalesMap.set(item.product_name, {
          quantity: current.quantity + Number(item.quantity),
          revenue: current.revenue + Number(item.total),
          cost: current.cost + (Number(productCost) * Number(item.quantity))
        });
      });
      
      const productSales = Array.from(productSalesMap.entries())
        .map(([name, data]) => ({ 
          name, 
          quantity: data.quantity, 
          revenue: data.revenue,
          cost: data.cost,
          profit: data.revenue - data.cost
        }))
        .sort((a, b) => b.revenue - a.revenue);

      csvContent += `INVENTORY SOLD (Stock Movement)\n`;
      csvContent += `Product Name,Quantity Sold,Unit Price Avg (${settings.currency}),Revenue (${settings.currency}),COGS (${settings.currency}),Profit (${settings.currency})\n`;
      productSales.forEach(product => {
        const avgPrice = product.revenue / product.quantity;
        csvContent += `"${product.name}",${product.quantity},${avgPrice.toFixed(2)},${product.revenue.toFixed(2)},${product.cost.toFixed(2)},${product.profit.toFixed(2)}\n`;
      });
      csvContent += `\n`;

      // === PAYMENT METHOD BREAKDOWN BY DAY ===
      const dailyPaymentMap = new Map<string, { cash: number; card: number; online: number }>();
      sortedOrders.forEach(order => {
        const dateKey = format(new Date(order.created_at), 'dd/MM/yyyy');
        const current = dailyPaymentMap.get(dateKey) || { cash: 0, card: 0, online: 0 };
        const amount = Number(order.total);
        
        if (order.payment_mode === 'Cash') current.cash += amount;
        else if (order.payment_mode === 'Card') current.card += amount;
        else if (order.payment_mode === 'Online') current.online += amount;
        
        dailyPaymentMap.set(dateKey, current);
      });

      csvContent += `DAILY PAYMENT BREAKDOWN\n`;
      csvContent += `Date,Cash (${settings.currency}),Card (${settings.currency}),Online (${settings.currency}),Total (${settings.currency})\n`;
      Array.from(dailyPaymentMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([date, payments]) => {
          const total = payments.cash + payments.card + payments.online;
          csvContent += `${date},${payments.cash.toFixed(2)},${payments.card.toFixed(2)},${payments.online.toFixed(2)},${total.toFixed(2)}\n`;
        });
      csvContent += `\n`;

      // === STAFF SALES LEDGER ===
      const staffMap = new Map<string, { orders: number; revenue: number; cash: number; card: number; online: number }>();
      filteredOrders.forEach(order => {
        const staffName = order.staff_name || 'Unknown';
        const current = staffMap.get(staffName) || { orders: 0, revenue: 0, cash: 0, card: 0, online: 0 };
        const amount = Number(order.total);
        
        current.orders += 1;
        current.revenue += amount;
        if (order.payment_mode === 'Cash') current.cash += amount;
        else if (order.payment_mode === 'Card') current.card += amount;
        else if (order.payment_mode === 'Online') current.online += amount;
        
        staffMap.set(staffName, current);
      });
      
      const staffPerformance = Array.from(staffMap.entries())
        .map(([staff, data]) => ({ staff, ...data }))
        .sort((a, b) => b.revenue - a.revenue);

      csvContent += `STAFF SALES LEDGER\n`;
      csvContent += `Staff Member,Transactions,Total Sales (${settings.currency}),Cash (${settings.currency}),Card (${settings.currency}),Online (${settings.currency}),Avg Transaction (${settings.currency})\n`;
      staffPerformance.forEach(staff => {
        const avgTransaction = staff.revenue / staff.orders;
        csvContent += `"${staff.staff}",${staff.orders},${staff.revenue.toFixed(2)},${staff.cash.toFixed(2)},${staff.card.toFixed(2)},${staff.online.toFixed(2)},${avgTransaction.toFixed(2)}\n`;
      });
      csvContent += `\n`;

      // === DETAILED LINE ITEMS (For Auditing) ===
      csvContent += `DETAILED LINE ITEMS (Invoice Items)\n`;
      csvContent += `Invoice No,Date,Time,Product,Category,Qty,Unit Price (${settings.currency}),Line Total (${settings.currency}),Payment Method,Staff\n`;
      sortedOrders.forEach(order => {
        const orderDate = new Date(order.created_at);
        const orderItems = filteredItems.filter((item: any) => item.order_id === order.id);
        orderItems.forEach((item: any) => {
          const product = productMap.get(item.product_name);
          const category = product?.category || 'N/A';
          csvContent += `${order.id},${format(orderDate, 'dd/MM/yyyy')},${format(orderDate, 'HH:mm')},` +
                       `"${item.product_name}","${category}",${item.quantity},${Number(item.price).toFixed(2)},` +
                       `${Number(item.total).toFixed(2)},${order.payment_mode || 'N/A'},"${order.staff_name || 'Unknown'}"\n`;
        });
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = format(startDate, 'dd-MM-yyyy');
      const endDateStr = dateRange.to ? `_to_${format(endDate, 'dd-MM-yyyy')}` : '';
      a.download = `FUDE_Accounting_Report_${dateStr}${endDateStr}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Accounting Report Generated',
        description: `Report has been downloaded and ready for accounting software`,
      });
    } catch (error) {
      console.error('Error generating CSV report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate CSV report',
        variant: 'destructive'
      });
    }
  };

  const handleDateSelect = (type: 'from' | 'to', date: Date | undefined) => {
    setDateRange(prev => ({
      ...prev,
      [type]: date
    }));
  };

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c7a956]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Analytics and sales insights</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={generateSettlementReport}>
              <FileText className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                <span>Settlement Report</span>
                <span className="text-xs text-gray-500">For printing & signatures</span>
              </div>
              <span className="ml-auto text-xs font-semibold text-gray-500">PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV}>
              <FileText className="w-4 h-4 mr-2" />
              <div className="flex flex-col">
                <span>Accounting Report</span>
                <span className="text-xs text-gray-500">For bookkeeping software</span>
              </div>
              <span className="ml-auto text-xs font-semibold text-gray-500">CSV</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Filter by Date:</span>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal text-xs sm:text-sm w-full sm:w-auto",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'Select Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => handleDateSelect('from', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {dateRange.from && (
              <>
                <span className="text-gray-400 hidden sm:inline">→</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal text-xs sm:text-sm w-full sm:w-auto",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'End Date (Optional)'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => handleDateSelect('to', date)}
                      initialFocus
                      disabled={(date) => dateRange.from ? date < dateRange.from : false}
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}

            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateFilter}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear Filter
              </Button>
            )}

            {dateRange.from && (
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                {dateRange.to 
                  ? `Showing data from ${format(dateRange.from, 'MMM dd')} to ${format(dateRange.to, 'MMM dd, yyyy')}`
                  : `Showing data for ${format(dateRange.from, 'MMM dd, yyyy')}`
                }
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#c7a956]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalItemsSold}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 rounded-lg">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Orders</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="p-2 sm:p-3 bg-amber-50 rounded-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Products</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 rounded-lg">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-[#c7a956] to-black rounded-full"></div>
              Sales by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-6">
                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {categoryData.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]}
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          padding: '12px'
                        }}
                        labelStyle={{
                          color: '#111827',
                          fontWeight: '600',
                          marginBottom: '4px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {categoryData.map((category, index) => {
                    const total = categoryData.reduce((sum, cat) => sum + cat.value, 0);
                    const percentage = ((category.value / total) * 100).toFixed(1);
                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all hover:shadow-sm group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{category.name}</p>
                            <p className="text-xs text-gray-500">{percentage}% of total stock value</p>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(category.value)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium">No category data available</p>
                <p className="text-xs mt-1">Add products to see stock distribution</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c7a956] to-black flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sold} units sold</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">No sales data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
