'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/kyc', label: 'Vérification KYC', icon: ShieldCheck },
  { href: '/admin/credits', label: 'Demandes crédit', icon: CreditCard },
  { href: '/admin/installments', label: 'Échéances', icon: CalendarClock },
  { href: '/admin/articles', label: 'Articles', icon: Package },
  { href: '/admin/invoices', label: 'Factures', icon: FileText },
  { href: '/admin/notifications', label: 'Alertes crédit', icon: Bell },
  { href: '/admin/messages', label: 'Messages reçus', icon: Mail },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setChecking(false);
      return;
    }

    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');

    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    if (user) {
      try {
        const parsed = JSON.parse(user);
        setAdminUser({ name: parsed.name || 'Admin', email: parsed.email || '' });
      } catch {
        setAdminUser({ name: 'Admin', email: '' });
      }
    }
    setChecking(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-200/40 border-t-cyan-300 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-950/95 border-r border-white/10 flex flex-col transition-transform duration-300 shadow-2xl shadow-black/30 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-950/40">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Creadi<span className="text-cyan-300">TN</span>
          </span>
          <span className="ml-auto text-[10px] font-bold text-cyan-200 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-300/20">
            ADMIN
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-black/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          {adminUser && (
            <div className="px-3 py-3 mb-2 rounded-xl bg-white/[0.03] border border-white/10">
              <p className="text-sm font-medium text-white truncate">{adminUser.name}</p>
              <p className="text-xs text-slate-400 truncate">{adminUser.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 sm:px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-300"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Ouvrir le menu admin"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-slate-400">
              {sidebarLinks.find((l) => l.href === pathname)?.label || 'Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_28rem),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_30rem)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
