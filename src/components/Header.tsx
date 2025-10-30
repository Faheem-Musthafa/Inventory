import { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function Header() {
  const [storeInfo, setStoreInfo] = useState({
    storeName: 'InventoryPro',
    storeEmail: 'admin@store.com',
  });

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    try {
      const docRef = doc(db, 'settings', 'store');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const settings = docSnap.data();
        setStoreInfo({
          storeName: settings.storeName || 'InventoryPro',
          storeEmail: settings.storeEmail || 'admin@store.com',
        });
      }
    } catch (error) {
      console.error('Error loading store info:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search products, orders..."
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Store Owner</p>
              <p className="text-xs text-gray-500">{storeInfo.storeEmail}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-medium">
              {getInitials(storeInfo.storeName)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
