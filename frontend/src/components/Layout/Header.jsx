import React from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ setIsOpen }) {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'SALES':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'WAREHOUSE':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ACCOUNTS':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left side: Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline-block text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          🏢 CRM & Operations Portal
        </span>
      </div>

      {/* Right side: User Profile & Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</div>
            <div className="text-xs text-slate-400 mt-1">{user?.email}</div>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 font-bold uppercase rounded-full border ${getRoleBadgeColor(
              user?.role
            )}`}
          >
            {user?.role}
          </span>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
