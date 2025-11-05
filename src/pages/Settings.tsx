import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  // Invoice Customization
  invoiceFooter: string;
  receiptSize: '80mm' | '58mm' | 'A4';
  showInstagram: boolean;
  showQRCode: boolean;
  // Table Management
  enableTableMode: boolean;
  numberOfTables: number;
  tablePrefix: string;
  defaultCovers: number;
  // Business Configuration
  businessHoursOpen: string;
  businessHoursClose: string;
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
  // Invoice Customization
  invoiceFooter: 'Thank you for your business!\nPlease visit again',
  receiptSize: '80mm',
  showInstagram: true,
  showQRCode: false,
  // Table Management
  enableTableMode: true,
  numberOfTables: 10,
  tablePrefix: 'Table',
  defaultCovers: 1,
  // Business Configuration
  businessHoursOpen: '08:00',
  businessHoursClose: '23:00',
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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">Manage your store settings and preferences</p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Brand Name</Label>
              <Input
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
                value={settings.storeAddress}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                placeholder="Shams Boutique - Al Reem Island - Abu Dhabi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store-phone">Phone Number</Label>
                <Input
                  id="store-phone"
                  value={settings.storePhone}
                  onChange={(e) => handleInputChange('storePhone', e.target.value)}
                  placeholder="028869949"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trn-code">TRN Code</Label>
                <Input
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
            <CardTitle>Invoice Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-footer">Invoice Footer Text</Label>
              <Textarea
                id="invoice-footer"
                value={settings.invoiceFooter}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('invoiceFooter', e.target.value)}
                placeholder="Thank you for your business!&#10;Please visit again"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">Appears at bottom of receipt (use new lines for multiple messages)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt-size">Receipt Paper Size</Label>
              <Select
                value={settings.receiptSize}
                onValueChange={(value) => handleInputChange('receiptSize', value)}
              >
                <SelectTrigger id="receipt-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80mm">80mm (Standard Thermal)</SelectItem>
                  <SelectItem value="58mm">58mm (Small Thermal)</SelectItem>
                  <SelectItem value="A4">A4 (Letter Size)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-instagram">Show Instagram on Receipt</Label>
                <p className="text-xs text-gray-500">Display Instagram handle on printed receipts</p>
              </div>
              <Switch
                id="show-instagram"
                checked={settings.showInstagram}
                onCheckedChange={(checked: boolean) => handleInputChange('showInstagram', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-qr">Show QR Code on Receipt</Label>
                <p className="text-xs text-gray-500">Display QR code linking to Instagram</p>
              </div>
              <Switch
                id="show-qr"
                checked={settings.showQRCode}
                onCheckedChange={(checked: boolean) => handleInputChange('showQRCode', checked)}
              />
            </div>

            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Invoice Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-table">Enable Table Mode</Label>
                <p className="text-xs text-gray-500">Allow table selection for dine-in orders</p>
              </div>
              <Switch
                id="enable-table"
                checked={settings.enableTableMode}
                onCheckedChange={(checked: boolean) => handleInputChange('enableTableMode', checked)}
              />
            </div>

            {settings.enableTableMode && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num-tables">Number of Tables</Label>
                    <Input
                      id="num-tables"
                      type="number"
                      min="1"
                      max="100"
                      value={settings.numberOfTables}
                      onChange={(e) => handleInputChange('numberOfTables', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table-prefix">Table Name Prefix</Label>
                    <Input
                      id="table-prefix"
                      value={settings.tablePrefix}
                      onChange={(e) => handleInputChange('tablePrefix', e.target.value)}
                      placeholder="Table, T, Booth"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-covers">Default Number of Covers</Label>
                  <Input
                    id="default-covers"
                    type="number"
                    min="1"
                    max="20"
                    value={settings.defaultCovers}
                    onChange={(e) => handleInputChange('defaultCovers', parseInt(e.target.value) || 1)}
                  />
                  <p className="text-xs text-gray-500">Default number of guests per table</p>
                </div>
              </>
            )}

            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Table Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours-open">Opening Time</Label>
                <Input
                  id="hours-open"
                  type="time"
                  value={settings.businessHoursOpen}
                  onChange={(e) => handleInputChange('businessHoursOpen', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours-close">Closing Time</Label>
                <Input
                  id="hours-close"
                  type="time"
                  value={settings.businessHoursClose}
                  onChange={(e) => handleInputChange('businessHoursClose', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Business hours used for reports and analytics</p>

            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Business Settings'}
            </Button>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
