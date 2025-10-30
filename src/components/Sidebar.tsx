import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { name: 'Products', icon: Package, id: 'products' },
  { name: 'Orders', icon: ShoppingCart, id: 'orders' },
  { name: 'Reports', icon: BarChart3, id: 'reports' },
  { name: 'Settings', icon: Settings, id: 'settings' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="w-64 border-r bg-white h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl text-gray-900">InventoryPro</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
