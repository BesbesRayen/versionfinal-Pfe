'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

type Step = 'request' | 'reset' | 'done';

async function backendPost(path: string, body: unknown) {
  const response = await fetch(`/api/backend${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Impossible de traiter la demande.');
  }
  return data as { message?: string };
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email') ?? '';
    const tokenParam = params.get('token') ?? '';
    if (!tokenParam) {
      return;
    }
    setIdentifier(emailParam);
    setToken(tokenParam);
    setStep('reset');
    setLoading(true);
    backendPost('/auth/forgot-password/validate', { identifier: emailParam, token: tokenParam })
      .then((data) => setMessage(data.message || 'Lien de reinitialisation valide.'))
      .catch((err) => setError(err instanceof Error ? err.message : 'Lien invalide ou expire.'))
      .finally(() => setLoading(false));
  }, []);

  async function requestResetLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await backendPost('/auth/forgot-password/request', { identifier });
      setMessage(data.message || 'Lien envoye.');
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email introuvable.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const data = await backendPost('/auth/forgot-password/confirm', {
        identifier,
        token,
        newPassword,
      });
      setMessage(data.message || 'Mot de passe reinitialise avec succes.');
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide ou expire.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070A12] px-4 py-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,93,251,0.22),transparent_28rem),radial-gradient(circle_at_bottom_right,rgba(25,195,125,0.14),transparent_28rem)]" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/login" className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-300 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Retour connexion
        </Link>

        <div className="rounded-[28px] border border-white/10 bg-[#111827]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-950/30">
              {step === 'done' ? <CheckCircle2 className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              {step === 'request' && 'Mot de passe oublie'}
              {step === 'reset' && 'Nouveau mot de passe'}
              {step === 'done' && 'Mot de passe modifie'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {step === 'request' && 'Entrez votre email pour recevoir un lien de reinitialisation.'}
              {step === 'reset' && 'Ouvrez le lien recu par email ou collez le jeton de reinitialisation, puis choisissez un nouveau mot de passe.'}
              {step === 'done' && 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'}
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={(event) => void requestResetLink(event)} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Email</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#0A0F1C] pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300/50"
                    placeholder="votre@email.com"
                  />
                </div>
              </label>
              <button disabled={loading} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 text-sm font-black text-white transition hover:bg-indigo-400 disabled:opacity-60">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                Envoyer le lien
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={(event) => void resetPassword(event)} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Jeton de reinitialisation</span>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    required
                    value={token}
                    onChange={(event) => setToken(event.target.value.trim())}
                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#0A0F1C] pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300/50"
                    placeholder="Collez le jeton recu par email"
                  />
                </div>
              </label>
              <PasswordField label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} />
              <PasswordField label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} />
              <button disabled={loading} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 text-sm font-black text-white transition hover:bg-indigo-400 disabled:opacity-60">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                Reinitialiser
              </button>
            </form>
          )}

          {step === 'done' && (
            <Link href="/login" className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#19C37D] text-sm font-black text-[#06100B] transition hover:bg-[#26D88F]">
              Se connecter
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="password"
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-14 w-full rounded-2xl border border-white/10 bg-[#0A0F1C] pl-12 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300/50"
          placeholder="Minimum 8 caracteres"
        />
      </div>
    </label>
  );
}
