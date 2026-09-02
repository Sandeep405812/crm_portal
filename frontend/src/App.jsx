import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetail from './pages/Customers/CustomerDetail';
import ProductList from './pages/Products/ProductList';
import StockMovementLogs from './pages/Inventory/StockMovementLogs';
import ChallanList from './pages/Challans/ChallanList';
import ChallanCreate from './pages/Challans/ChallanCreate';
import ChallanDetail from './pages/Challans/ChallanDetail';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '10px',
              padding: '10px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />

        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Layout Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Customer CRM Module */}
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            {/* Product & Stock Module */}
            <Route path="/products" element={<ProductList />} />

            {/* Inventory Stock Movement Logs */}
            <Route path="/inventory/logs" element={<StockMovementLogs />} />

            {/* Sales Challan Module */}
            <Route path="/challans" element={<ChallanList />} />
            <Route path="/challans/new" element={<ChallanCreate />} />
            <Route path="/challans/:id" element={<ChallanDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
