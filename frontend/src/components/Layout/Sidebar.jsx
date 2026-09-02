import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  FileText,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
    {
      name: 'Customers & CRM',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'SALES'],
    },
    {
      name: 'Products & Stock',
      path: '/products',
      icon: Package,
      roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'],
    },
    {
      name: 'Stock Movement Logs',
      path: '/inventory/logs',
      icon: Boxes,
      roles: ['ADMIN', 'WAREHOUSE'],
    },
    {
      name: 'Sales Challans',
      path: '/challans',
      icon: FileText,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'],
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => user?.role === 'ADMIN' || item.roles.includes(user?.role)
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col border-r border-slate-800 shadow-xl`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 bg-slate-950 border-b border-slate-800">
        <div className="p-2 bg-amber-600 rounded-lg text-white shadow-md shadow-amber-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white leading-tight">CRM PORTAL</h1>
          <p className="text-xs text-slate-400 font-medium">Operations & Client Management</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Modules
        </div>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Role Card */}
      <div className="p-4 m-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Active Role</span>
        </div>
        <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
          {user?.role || 'Guest'}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 truncate">{user?.name}</p>
      </div>
    </aside>
  );
}
