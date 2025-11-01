import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface StoreSettings {
  logo: string;
  companyName: string;
  storeName: string;
  storeEmail: string;
  storeAddress: string;
  storePhone: string;
  trnCode: string;
  staffName: string;
  instagramHandle: string;
  taxRate: number;
  currency: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  logo: 'JAMES',
  companyName: 'JAMES CAFE LTD',
  storeName: 'InventoryPro',
  storeEmail: 'admin@store.com',
  storeAddress: 'Shams Boutique - Al Reem Island - Abu Dhabi',
  storePhone: '028869949',
  trnCode: '100569844200003',
  staffName: 'Daniel',
  instagramHandle: '@jamescafe.ae',
  taxRate: 5,
  currency: 'AED',
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
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Brand Name</Label>
              <Input
                disabled
                id="logo"
                value={settings.logo}
                onChange={(e) => handleInputChange('logo', e.target.value)}
                placeholder="JAMES"
              />
              <p className="text-xs text-gray-500">Brand name shown at top of receipt</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                disabled
                id="company-name"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="JAMES CAFE LTD"
              />
              <p className="text-xs text-gray-500">Full legal company name</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-address">Company Address</Label>
              <Input
                id="store-address"
                disabled
                value={settings.storeAddress}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                placeholder="Shams Boutique - Al Reem Island - Abu Dhabi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone Number</Label>
                <Input
                  disabled
                  id="store-phone"
                  value={settings.storePhone}
                  onChange={(e) => handleInputChange('storePhone', e.target.value)}
                  placeholder="028869949"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trn-code">TRN Code</Label>
                <Input
                  disabled
                  id="trn-code"
                  value={settings.trnCode}
                  onChange={(e) => handleInputChange('trnCode', e.target.value)}
                  placeholder="100569844200003"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">Default Staff Name <span className='text-[#c7a956]'>&#40;can be changed&#41;*</span></Label>
                <Input
                  id="staff-name"
                  value={settings.staffName}
                  onChange={(e) => handleInputChange('staffName', e.target.value)}
                  placeholder="Daniel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram-handle">Instagram Handle</Label>
                <Input
                  disabled
                  id="instagram-handle"
                  value={settings.instagramHandle}
                  onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                  placeholder="@jamescafe.ae"
                />
              </div>
            </div>

            <Button onClick={saveSettings} disabled={saving} >
              {saving ? 'Saving...' : 'Save Invoice Settings'}
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
                  disabled
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
                  disabled
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

        
        
      </div>
    </div>
  );
}
