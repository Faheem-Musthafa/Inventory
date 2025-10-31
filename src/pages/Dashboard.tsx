import { useEffect, useState } from 'react';
import { Package, ShoppingCart,Plus, DollarSign } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  stockValue: number;
  todaySales: number;
}

interface StoreSettings {
  currency: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  currency: 'AED',
};

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    stockValue: 0,
    todaySales: 0,
  });
  const [salesData, setSalesData] = useState<Array<{ date: string; sales: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
    loadDashboardData();
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

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch today's orders
      const todayStart = format(new Date(), 'yyyy-MM-dd');
      const todayOrdersQuery = query(
        collection(db, 'orders'),
        where('created_at', '>=', todayStart)
      );
      const todayOrdersSnapshot = await getDocs(todayOrdersQuery);
      const todayOrders = todayOrdersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const stockValue = products.reduce((sum: number, p: any) => sum + (Number(p.price) * p.stock), 0);
      const todaySales = todayOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0);

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        stockValue,
        todaySales,
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const daySales = orders
          .filter((o: any) => {
            if (!o.created_at) return false;
            try {
              // Handle both timestamp and string formats
              const orderDate = typeof o.created_at === 'string' 
                ? new Date(o.created_at) 
                : new Date(o.created_at);
              if (isNaN(orderDate.getTime())) return false;
              return format(orderDate, 'yyyy-MM-dd') === dateStr;
            } catch {
              return false;
            }
          })
          .reduce((sum: number, o: any) => sum + Number(o.total), 0);

        return {
          date: format(date, 'MMM dd'),
          sales: daySales,
        };
      });

      setSalesData(last7Days);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your business overview</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onNavigate('products')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Button onClick={() => onNavigate('orders')}>
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          trendUp
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          // trend="+8% from last month"
          trendUp
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(stats.stockValue)}
          icon={DollarSign}
          // trend="+5% from last month"
          trendUp
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          icon={TrendingUp}
          // trend="+15% from yesterday"
          trendUp
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Summary (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                />
                <Bar dataKey="sales" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
