import { useState, useEffect } from 'react';
import './App.css';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Orders } from '@/pages/Orders';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { Toaster } from '@/components/ui/toaster';
import { isAuthenticated, clearCurrentUser, getCurrentUser, isStaff } from '@/lib/auth';

function App() {
  const [currentPage, setCurrentPage] = useState('products');
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const authStatus = isAuthenticated();
    setIsAuthenticatedState(authStatus);
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticatedState(true);
  };

  const handleLogout = () => {
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
      case 'settings':
        return <Settings />;
      default:
        return <Products />;
    }
  };

  // Show main app if authenticated
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Header onLogout={handleLogout} />
        <main className="flex-1 p-8">
          {renderPage()}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
