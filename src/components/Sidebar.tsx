import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getCurrentUser, isStaff } from '@/lib/auth';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navigation = [
  { name: 'Menu', icon: Package, id: 'products' },
  { name: 'Orders', icon: ShoppingCart, id: 'orders' },
  { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { name: 'Reports', icon: BarChart3, id: 'reports' },
  { name: 'Archive', icon: Archive, id: 'archive' },
  { name: 'Settings', icon: Settings, id: 'settings' },
];

export function Sidebar({ currentPage, onNavigate, isOpen = true, onClose }: SidebarProps) {
  const [storeName, setStoreName] = useState('InventoryPro');
  const currentUser = getCurrentUser();
  const userIsStaff = isStaff(currentUser);

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

  const handleNavigate = (page: string) => {
    onNavigate(page);
    if (onClose) onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-gradient-to-b from-[#bda15e] to-[#9e8447] h-screen flex flex-col shadow-xl transition-transform duration-300 ease-in-out z-50",
        "fixed lg:sticky top-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Brand Header */}
      <div className="p-6 border-b border-[#c7a956]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-[#bda15e]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">{storeName}</h1>
            <p className="text-[#ded1a2] text-xs">Inventory System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3">
        {navigation.map((item) => {
          // Filter navigation for staff - only show Menu (products), Orders, and Settings
          if (userIsStaff && !['products', 'orders', 'dashboard'].includes(item.id)) {
            return null;
          }

          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
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
          <p className="mt-1">Powered by FUDE Studio Dubai</p>
        </div>
      </div>
    </div>
    </>
  );
}