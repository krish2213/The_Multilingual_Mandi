import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { SocketProvider, useSocket } from './contexts/SocketContext';
import RoleSelector from './components/RoleSelector';
import VendorSetup from './components/vendor/VendorSetup';
import InventoryManagement from './components/vendor/InventoryManagement';
import VendorDashboard from './components/vendor/VendorDashboard';
import CustomerEntry from './components/customer/CustomerEntry';
import CustomerShopping from './components/customer/CustomerShopping';
import './i18n';

function AppContent() {
  const [currentView, setCurrentView] = useState('role-selector');
  const [vendorData, setVendorData] = useState({});
  const { session, role } = useSocket();

  // ❌ REMOVED THE BUGGY useEffect THAT WAS SKIPPING INVENTORY!
  // The manual navigation is enough - we don't need auto-switching

  const handleRoleSelect = (selectedRole) => {
    if (selectedRole === 'vendor') {
      setCurrentView('vendor-setup');
    } else {
      setCurrentView('customer-entry');
    }
  };

  const handleVendorSetupComplete = (setupData) => {
    console.log('✓ Vendor setup complete, showing inventory management');
    setVendorData(prev => ({ ...prev, ...setupData }));
    setCurrentView('inventory-management');
  };

  const handleInventoryComplete = (products) => {
    console.log('✓ Inventory complete, showing dashboard');
    setVendorData(prev => ({ ...prev, products }));
    setCurrentView('vendor-dashboard');
  };

  const handleCustomerJoinSuccess = (joinData) => {
    console.log('✓ Customer joined, showing shopping');
    setCurrentView('customer-shopping');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'role-selector':
        return <RoleSelector onRoleSelect={handleRoleSelect} />;
      
      case 'vendor-setup':
        return <VendorSetup onSetupComplete={handleVendorSetupComplete} />;
      
      case 'inventory-management':
        console.log('📦 Rendering Inventory Management with categories:', vendorData.categories);
        return (
          <InventoryManagement 
            categories={vendorData.categories}
            onInventoryComplete={handleInventoryComplete}
          />
        );
      
      case 'vendor-dashboard':
        return <VendorDashboard products={vendorData.products || []} />;
      
      case 'customer-entry':
        return <CustomerEntry onJoinSuccess={handleCustomerJoinSuccess} />;
      
      case 'customer-shopping':
        return <CustomerShopping />;
      
      default:
        return <RoleSelector onRoleSelect={handleRoleSelect} />;
    }
  };

  return (
    <div className="App">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          <div>View: {currentView}</div>
          <div>Categories: {vendorData.categories?.join(', ') || 'none'}</div>
          <div>Products: {vendorData.products?.length || 0}</div>
        </div>
      )}
      
      {renderCurrentView()}
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App;