import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user.role !== 'ADMIN' && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:pl-64">
        <Header setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 bg-red-50 text-red-600 rounded-full mb-3">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md">
            Your role (<strong className="uppercase">{user.role}</strong>) does not have permission to access this module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header setIsOpen={setSidebarOpen} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
