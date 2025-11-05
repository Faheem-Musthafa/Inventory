import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Orders } from '@/pages/Orders';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { Archive } from '@/pages/Archive';
import { Login } from '@/pages/Login';
import { Toaster } from '@/components/ui/toaster';
import { isAuthenticated, clearCurrentUser, getCurrentUser, isStaff } from '@/lib/auth';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { generateStaffReport, clearStaffSales, getSalesFromStorage } from '@/lib/salesTracking';
import { generateStaffSalesPDF } from '@/lib/pdfGenerator';
import { scheduleArchive } from '@/lib/archiveSystem';



function App() {
  const [currentPage, setCurrentPage] = useState('products');
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = isAuthenticated();
    setIsAuthenticatedState(authStatus);
    setIsLoading(false);
  }, []);

  // Initialize automatic archive system (runs at 2:00 AM daily)
  useEffect(() => {
    if (isAuthenticatedState) {
      console.log('Initializing automatic archive system...');
      scheduleArchive();
    }
  }, [isAuthenticatedState]);

  const handleLogin = () => {
    setIsAuthenticatedState(true);
  };

  const handleLogout = async () => {
    const currentUser = getCurrentUser();
    
    // Generate PDF report for staff members before logout
    if (currentUser && isStaff(currentUser)) {
      const sales = getSalesFromStorage(currentUser.email);
      
      // Only generate PDF if there are sales recorded
      if (sales.length > 0) {
        try {
          const report = generateStaffReport(currentUser.name || 'Staff', currentUser.email);
          
          // Get currency symbol from settings
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          const settingsDoc = await getDoc(doc(db, 'settings', 'store'));
          const currencySymbol = settingsDoc.exists() ? settingsDoc.data()?.currency || 'AED' : 'AED';
          
          generateStaffSalesPDF(report, currencySymbol);
          
          // Clear the sales data after generating report
          clearStaffSales(currentUser.email);
        } catch (error) {
          console.error('Error generating staff report:', error);
        }
      }
    }
    
    clearCurrentUser();
    setIsAuthenticatedState(false);
    setCurrentPage('products');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#bda15e]"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticatedState) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  const renderPage = () => {
    const currentUser = getCurrentUser();
    const userIsStaff = isStaff(currentUser);

    // Staff access control - only allow products, orders, and settings
    if (userIsStaff && !['products', 'orders', 'dashboard'].includes(currentPage)) {
      // Redirect staff to products if they try to access restricted pages
      setCurrentPage('products');
      return <Products />;
    }

    switch (currentPage) {
      case 'products':
        return <Products />;
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <Orders />;
      case 'reports':
        return <Reports />;
      case 'archive':
        return <Archive />;
      case 'settings':
        return <Settings />;
      default:
        return <Products />;
    }
  };

  // Show main app if authenticated
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
      <Toaster />
      <SpeedInsights />
    </div>
  );
}

export default App;
