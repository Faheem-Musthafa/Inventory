import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navigation = [
  { name: 'Menu', icon: Package, id: 'products' },
  { name: 'Orders', icon: ShoppingCart, id: 'orders' },
  { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { name: 'Reports', icon: BarChart3, id: 'reports' },
  { name: 'Settings', icon: Settings, id: 'settings' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [storeName, setStoreName] = useState('InventoryPro');

  useEffect(() => {
    loadStoreName();
  }, []);

  const loadStoreName = async () => {
    try {
      const docRef = doc(db, 'settings', 'store');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const settings = docSnap.data();
        setStoreName(settings.storeName || 'InventoryPro');
      }
    } catch (error) {
      console.error('Error loading store name:', error);
    }
  };

  return (
    <div className="w-64 bg-gradient-to-b from-[#bda15e] to-[#9e8447] h-screen sticky top-0 flex flex-col shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#c7a956]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-[#bda15e]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">{storeName}</h1>
            <p className="text-[#e8d9a3] text-xs">Inventory System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mb-2 transition-all duration-200',
                isActive
                  ? 'bg-white text-[#bda15e] shadow-lg'
                  : 'text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#c7a956]">
        <div className="text-center text-[#e8d9a3] text-xs">
          <p>© 2025 {storeName}</p>
          <p className="mt-1">Powered by Afonex</p>
        </div>
      </div>
    </div>
  );
}