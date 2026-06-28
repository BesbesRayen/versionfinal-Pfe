'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  X,
  CreditCard,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Phone,
} from 'lucide-react';

const paymentRules = [
  ['Payment Obligation', 'All invoices, subscriptions, service fees, and amounts related to the use of the application must be paid on or before the due date shown in the app or invoice.'],
  ['Late Payment Penalty', 'If payment is not completed on time, a late payment penalty of [X]% may be added to the outstanding amount, according to the payment rules applied in the application.'],
  ['Account Suspension', 'In case of unpaid invoices or delayed payment, the company reserves the right to temporarily suspend or restrict access to the application until the full payment is received.'],
  ['Payment Reminders', 'The client may receive one or more reminders by notification, email, phone, or any other communication method available in the application.'],
  ['Legal Recovery', 'If payment is still not completed after reminders, the company reserves the right to transfer the case to a lawyer, debt collection service, or any competent legal authority.'],
  ['Additional Costs', 'Any legal, administrative, recovery, lawyer, or collection fees caused by non-payment may be charged to the client, where permitted by law.'],
] as const;

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

  const passwordRequirements = [
    { label: '8 caractères minimum', met: formData.password.length >= 8 },
    { label: 'Une lettre majuscule', met: /[A-Z]/.test(formData.password) },
    { label: 'Un chiffre', met: /\d/.test(formData.password) },
    {
      label: 'Les mots de passe correspondent',
      met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
    },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          termsAccepted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Erreur lors de l\'inscription');
      } else {
        window.location.href = '/login?registered=1';
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative pt-24 pb-10">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]" />
      <div className="absolute top-20 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4">
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
              Créez votre compte
            </h1>
            <p className="text-gray-400">
              Rejoignez CreditTN et commencez à payer en plusieurs fois
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Prénom
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="input-field !pl-12"
                    placeholder="Prénom"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nom
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="input-field"
                  placeholder="Nom"
                />
              </div>
            </div>

            {/* Email */}
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
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="input-field !pl-12"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1.5">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="input-field !pl-12"
                  placeholder="+216 XX XXX XXX"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="input-field !pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        req.met ? 'bg-accent-500' : 'bg-white/10'
                      } transition-colors`}
                    >
                      {req.met && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`text-xs ${
                        req.met ? 'text-accent-700' : 'text-gray-500'
                      }`}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Terms */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Client Terms &amp; Payment Rules</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Read and accept the payment rules before creating your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTermsConfirmed(acceptTerms);
                    setShowTerms(true);
                  }}
                  className="shrink-0 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  {acceptTerms ? 'Accepted' : 'Read terms'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="btn-primary w-full gap-2 !py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-400 font-semibold"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-terms-title"
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#11162a] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <h2 id="payment-terms-title" className="text-xl font-bold text-white">
                  Client Terms &amp; Payment Rules
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Before creating an account and using the application, please read and accept the following terms.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                aria-label="Close terms"
                className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              {paymentRules.map(([title, body], index) => (
                <div key={title}>
                  <h3 className="font-semibold text-white">{index + 1}. {title}</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-300">{body}</p>
                </div>
              ))}

              <div className="border-t border-white/10 pt-5">
                <h3 className="font-semibold text-white">Confirmation</h3>
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    checked={termsConfirmed}
                    onChange={(event) => setTermsConfirmed(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-sm leading-5 text-gray-200">
                    I have read, understood, and agree to the Client Terms &amp; Payment Rules.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 p-5">
              <button
                type="button"
                onClick={() => {
                  setTermsConfirmed(false);
                  setAcceptTerms(false);
                  setShowTerms(false);
                }}
                className="flex-1 rounded-xl border border-white/15 px-4 py-3 font-semibold text-gray-200 hover:bg-white/5"
              >
                Refuse
              </button>
              <button
                type="button"
                disabled={!termsConfirmed}
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTerms(false);
                  setError('');
                }}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
