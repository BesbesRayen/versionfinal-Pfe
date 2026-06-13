'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Bell,
  CreditCard,
  Gift,
  Home,
  LogOut,
  Menu,
  ShoppingBag,
  User,
  Wallet,
  X,
} from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/boutiques', label: 'Shopping', icon: ShoppingBag },
  { href: '/dashboard', label: 'Mes Paiements', icon: Wallet },
  { href: '/support', label: 'Support', icon: Gift },
];

type JwtUser = {
  id?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [jwtUser, setJwtUser] = useState<JwtUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const readUser = () => {
      const stored = localStorage.getItem('user');
      if (!stored) {
        setJwtUser(null);
        return;
      }

      try {
        setJwtUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
        setJwtUser(null);
      }
    };

    readUser();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        readUser();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const updateUnread = (event: Event) => {
      const count = Number((event as CustomEvent<{ count: number }>).detail?.count ?? 0);
      setUnreadCount(Number.isFinite(count) ? Math.max(0, count) : 0);
    };
    window.addEventListener('credittn:notification-count', updateUnread);

    const token = localStorage.getItem('token');
    const userId = jwtUser?.userId ?? jwtUser?.id;
    if (token && userId) {
      fetch(`/api/backend/api/notifications/unread-count?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.ok ? response.json() : 0)
        .then((count) => setUnreadCount(Number(count) || 0))
        .catch(() => setUnreadCount(0));
    }

    return () => window.removeEventListener('credittn:notification-count', updateUnread);
  }, [jwtUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isLoggedIn = Boolean(jwtUser);
  const displayName = jwtUser
    ? `${jwtUser.firstName} ${jwtUser.lastName}`.trim()
    : '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setJwtUser(null);

    window.location.replace('/login');
  };

  const handleNotifications = () => {
    if (pathname === '/dashboard') {
      window.dispatchEvent(new CustomEvent('credittn:open-notifications'));
      return;
    }

    window.location.assign('/dashboard?notifications=open');
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/10 bg-slate-950/95 shadow-lg shadow-black/20 backdrop-blur-xl'
          : 'bg-slate-950/80 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <nav className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex flex-shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-950/40 transition-all group-hover:shadow-lg group-hover:shadow-indigo-950/50">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Credit<span className="text-indigo-300">TN</span>
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-indigo-500/20 text-indigo-200'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleNotifications}
                className="relative rounded-2xl p-2 transition-colors hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-black text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 transition-all hover:border-indigo-300/40"
                >
                  <BarChart2 className="h-4 w-4 text-indigo-300" />
                  <span className="text-xs font-bold text-indigo-200">Score Credit</span>
                </Link>
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">{displayName.split(' ')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-2xl p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  title="Deconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:bg-indigo-500/10 hover:text-indigo-200"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-950/40 transition-all hover:bg-indigo-500 hover:shadow-md"
                >
                  Commencer
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {isLoggedIn && (
              <button
                type="button"
                onClick={handleNotifications}
                className="relative rounded-2xl p-2 transition-colors hover:bg-white/5"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-black text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-2xl p-2 transition-colors hover:bg-white/5"
              aria-label="Menu"
            >
              {isOpen ? <X className="h-5 w-5 text-slate-300" /> : <Menu className="h-5 w-5 text-slate-300" />}
            </button>
          </div>
        </nav>

        {isOpen && (
          <div className="animate-fade-in border-t border-white/10 bg-slate-950 md:hidden">
            <div className="space-y-1 px-4 py-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      active ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}

              <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{displayName}</p>
                        <p className="text-xs text-indigo-300">Voir mon score credit</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Deconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block w-full rounded-2xl bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="block w-full rounded-2xl bg-indigo-600 px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-indigo-500"
                    >
                      Commencer gratuitement
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
