export interface StaffSale {
  orderId: string;
  total: number;
  subtotal: number;
  tax: number;
  paymentMode: 'Cash' | 'Card';
  timestamp: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export interface StaffSalesReport {
  staffName: string;
  staffEmail: string;
  sales: StaffSale[];
  totalCashSales: number;
  totalCardSales: number;
  totalTransactions: number;
  grossSales: number;
  netSales: number;
  taxCollected: number;
  sessionStart: string;
  sessionEnd: string;
}

const SALES_STORAGE_KEY = 'staff_sales_';

export const addSaleToStorage = (staffEmail: string, sale: StaffSale): void => {
  const storageKey = `${SALES_STORAGE_KEY}${staffEmail}`;
  const existingSales = getSalesFromStorage(staffEmail);
  
  existingSales.push(sale);
  localStorage.setItem(storageKey, JSON.stringify(existingSales));
};

export const getSalesFromStorage = (staffEmail: string): StaffSale[] => {
  const storageKey = `${SALES_STORAGE_KEY}${staffEmail}`;
  const salesData = localStorage.getItem(storageKey);
  
  if (!salesData) return [];
  
  try {
    return JSON.parse(salesData) as StaffSale[];
  } catch {
    return [];
  }
};

export const generateStaffReport = (staffName: string, staffEmail: string): StaffSalesReport => {
  const sales = getSalesFromStorage(staffEmail);
  
  const totalCashSales = sales
    .filter(sale => sale.paymentMode === 'Cash')
    .reduce((sum, sale) => sum + sale.total, 0);
  
  const totalCardSales = sales
    .filter(sale => sale.paymentMode === 'Card')
    .reduce((sum, sale) => sum + sale.total, 0);
  
  const grossSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const netSales = sales.reduce((sum, sale) => sum + sale.subtotal, 0);
  const taxCollected = sales.reduce((sum, sale) => sum + sale.tax, 0);
  
  const timestamps = sales.map(s => new Date(s.timestamp).getTime());
  const sessionStart = timestamps.length > 0 
    ? new Date(Math.min(...timestamps)).toISOString()
    : new Date().toISOString();
  const sessionEnd = new Date().toISOString();
  
  return {
    staffName,
    staffEmail,
    sales,
    totalCashSales,
    totalCardSales,
    totalTransactions: sales.length,
    grossSales,
    netSales,
    taxCollected,
    sessionStart,
    sessionEnd,
  };
};

export const clearStaffSales = (staffEmail: string): void => {
  const storageKey = `${SALES_STORAGE_KEY}${staffEmail}`;
  localStorage.removeItem(storageKey);
};

export const initializeStaffSession = (staffEmail: string): void => {
  // Check if there's existing data, if not, initialize empty array
  const existingSales = getSalesFromStorage(staffEmail);
  if (existingSales.length === 0) {
    localStorage.setItem(`${SALES_STORAGE_KEY}${staffEmail}`, JSON.stringify([]));
  }
};
