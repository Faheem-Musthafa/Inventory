import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storeAddress: string;
  storePhone: string;
  taxRate: number;
  currency: string;
  lowStockAlerts: boolean;
  orderNotifications: boolean;
  dailyReports: boolean;
  lowStockThreshold: number;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'InventoryPro',
  storeEmail: 'admin@store.com',
  storeAddress: '123 Business Street, City, State 12345',
  storePhone: '(555) 123-4567',
  taxRate: 10,
  currency: 'AED',
  lowStockAlerts: true,
  orderNotifications: true,
  dailyReports: false,
  lowStockThreshold: 10,
};

export function Settings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'store');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...docSnap.data() } as StoreSettings);
      } else {
        // Initialize with default settings
        await setDoc(docRef, DEFAULT_SETTINGS);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error loading settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'store');
      await setDoc(docRef, settings);
      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StoreSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your store settings and preferences</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  value={settings.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-email">Email</Label>
                <Input
                  id="store-email"
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => handleInputChange('storeEmail', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-address">Address</Label>
              <Input
                id="store-address"
                value={settings.storeAddress}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-phone">Phone</Label>
              <Input
                id="store-phone"
                value={settings.storePhone}
                onChange={(e) => handleInputChange('storePhone', e.target.value)}
              />
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax & Currency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  placeholder="AED, $, € etc."
                />
              </div>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
              <Input
                id="low-stock-threshold"
                type="number"
                min="0"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  handleInputChange('lowStockThreshold', parseInt(e.target.value) || 0)
                }
              />
              <p className="text-sm text-gray-500">
                Products with stock below this number will be highlighted
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Low Stock Alerts</p>
                <p className="text-sm text-gray-500">
                  Get notified when products are running low
                </p>
              </div>
              <Switch
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => {
                  handleInputChange('lowStockAlerts', checked);
                  saveSettings();
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Notifications</p>
                <p className="text-sm text-gray-500">Receive alerts for new orders</p>
              </div>
              <Switch
                checked={settings.orderNotifications}
                onCheckedChange={(checked) => {
                  handleInputChange('orderNotifications', checked);
                  saveSettings();
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Reports</p>
                <p className="text-sm text-gray-500">Get daily sales summary via email</p>
              </div>
              <Switch
                checked={settings.dailyReports}
                onCheckedChange={(checked) => {
                  handleInputChange('dailyReports', checked);
                  saveSettings();
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
