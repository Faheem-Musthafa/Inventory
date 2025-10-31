import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { db, type Product, type Order } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

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
    from: undefined,
    to: undefined,
  });
  const [settings, setSettings] = useState<StoreSettings>({
    currency: 'AED',
  });

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

      // Filter orders by date range if selected
      if (dateRange.from && dateRange.to) {
        const fromDate = startOfDay(dateRange.from);
        const toDate = endOfDay(dateRange.to);
        
        orders = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return isWithinInterval(orderDate, { start: fromDate, end: toDate });
        });
      }

      // Filter items based on the filtered orders
      const filteredOrderIds = new Set(orders.map(o => o.id));
      const filteredItems = items.filter((item: any) => filteredOrderIds.has(item.order_id));

      // Calculate total revenue
      const totalRev = orders.reduce((sum, o) => sum + Number(o.total), 0);
      setTotalRevenue(totalRev);
      
      // Calculate total orders
      setTotalOrders(orders.length);
      
      // Calculate total products
      setTotalProducts(products.length);
      
      // Calculate total items sold (from filtered items)
      const totalSold = filteredItems.reduce((sum, item: any) => sum + Number(item.quantity || 0), 0);
      setTotalItemsSold(totalSold);

      // Category data based on sold items revenue (from filtered items)
      const categoryMap = new Map<string, number>();
      filteredItems.forEach((item: any) => {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const current = categoryMap.get(product.category) || 0;
          categoryMap.set(product.category, current + Number(item.total));
        }
      });

      const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));
      setCategoryData(catData);

      // Top products with quantity sold and revenue (from filtered items)
      const productMap = new Map<string, { sold: number; revenue: number }>();
      filteredItems.forEach((item: any) => {
        const current = productMap.get(item.product_name) || { sold: 0, revenue: 0 };
        productMap.set(item.product_name, {
          sold: current.sold + Number(item.quantity),
          revenue: current.revenue + Number(item.total)
        });
      });

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

  const exportToCSV = () => {
    const headers = ['Product', 'Quantity Sold', 'Revenue'];
    const rows = topProducts.map((p) => [p.name, p.sold, p.revenue.toFixed(2)]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Analytics and sales insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'From Date'}
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

            <span className="text-gray-400">→</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'To Date'}
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

            {dateRange.from && dateRange.to && (
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                Showing data from {format(dateRange.from, 'MMM dd')} to {format(dateRange.to, 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-3xl font-bold text-gray-900">{totalItemsSold}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
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
