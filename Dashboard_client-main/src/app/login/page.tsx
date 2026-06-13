'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }, []);

  // Show success banner if coming from registration
  const isRegistered = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('registered') === '1';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try admin login first
      const adminRes = await fetch('/api/backend/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (adminRes.ok) {
        const adminData = await adminRes.json();
        localStorage.setItem('adminToken', adminData.token || 'admin-session');
        localStorage.setItem('adminUser', JSON.stringify({ name: adminData.name || 'Admin', email: adminData.email }));
        window.location.replace('/admin');
        return;
      }

      // Regular user login
      const res = await fetch('/api/backend/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erreur de connexion');
      } else {
        // Store the real JWT token returned by the backend
        localStorage.setItem('token', data.token ?? '');
        localStorage.setItem('user', JSON.stringify({
          userId: data.userId,
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
        }));
        window.location.replace('/dashboard');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative pt-20 pb-10">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]" />
      <div className="absolute top-20 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Card */}
        <div className="glass-card p-8 md:p-10 glow">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">
                Credit<span className="text-indigo-400">TN</span>
              </span>
            </Link>
            <h1 className="text-2xl font-display font-bold text-white mb-2">
              Bon retour !
            </h1>
            <p className="text-gray-400">
              Connectez-vous à votre compte CreditTN
            </p>
          </div>

          {/* Success banner after registration */}
          {isRegistered && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm text-emerald-400 font-semibold">✔ Compte créé avec succès ! Connectez-vous.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-12"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-sm text-indigo-400 hover:text-indigo-400 font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pl-12 !pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full gap-2 !py-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-400 font-semibold"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
