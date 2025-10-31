import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db, type Product, type Order } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface StoreSettings {
  currency: string;
}

export function Reports() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [averageOrder, setAverageOrder] = useState(0);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number }>>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings>({
    currency: 'AED',
  });

  useEffect(() => {
    loadSettings();
    loadReports();
  }, []);

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

      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const total = orders.reduce((sum, o) => sum + Number(o.total), 0);
      setTotalSales(total);
      setTotalOrders(orders.length);
      setAverageOrder(orders.length > 0 ? total / orders.length : 0);

      const categoryMap = new Map<string, number>();
      products.forEach((p) => {
        const current = categoryMap.get(p.category) || 0;
        categoryMap.set(p.category, current + Number(p.price) * p.stock);
      });

      const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));
      setCategoryData(catData);

      const productMap = new Map<string, number>();
      items.forEach((item: any) => {
        const current = productMap.get(item.product_name) || 0;
        productMap.set(item.product_name, current + Number(item.total));
      });

      const top = Array.from(productMap.entries())
        .map(([name, revenue]) => ({ name, revenue }))
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
    const headers = ['Product', 'Revenue'];
    const rows = topProducts.map((p) => [p.name, p.revenue.toFixed(2)]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bda15e]"></div>
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
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
              </div>
              <div className="p-3 bg-[#ccb88b] rounded-lg">
                <DollarSign className="w-6 h-6 text-[#bda15e]" />
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
                <p className="text-sm font-medium text-gray-600">Average Order</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(averageOrder)}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-b from-[#cfb579] to-purple-600 rounded-full"></div>
              Stock Value by Category
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
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#f1e6bc] flex items-center justify-center text-[#b38d42] font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{product.name}</span>
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
