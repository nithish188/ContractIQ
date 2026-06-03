import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, UploadCloud, LogOut, FileText, User } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2 group">
        <div className="bg-gradient-to-tr from-brand-purple to-brand-indigo p-2 rounded-lg text-white shadow-md shadow-brand-purple/20 transition-transform group-hover:scale-105">
          <Shield className="w-6 h-6" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Contract<span className="text-brand-purple font-extrabold">IQ</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <Link
          to="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname === '/dashboard'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>

        <Link
          to="/upload"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            location.pathname === '/upload'
              ? 'bg-white/10 text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Analyze Contract
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <div className="w-6 h-6 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple text-xs font-semibold uppercase">
            {user.name ? user.name[0] : 'U'}
          </div>
          <span className="text-xs font-medium text-slate-300 pr-1 max-w-[120px] truncate">
            {user.name || 'User'}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
