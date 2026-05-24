'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Apple, ArrowRight, CheckCircle2, Download, Loader2, Play, Smartphone, Terminal, TriangleAlert } from 'lucide-react';
import {
  detectMobileOS,
  EXPO_LINKING_PREFIXES,
  getAutomaticDownloadTarget,
  MOBILE_DOWNLOAD_CONFIG,
  MobileOS,
} from '@/lib/mobile-download';

type RedirectState = 'idle' | 'loading' | 'success' | 'error';

export default function DownloadAppPage() {
  const [platform, setPlatform] = useState<MobileOS>('desktop');
  const [seconds, setSeconds] = useState(2);
  const [redirectState, setRedirectState] = useState<RedirectState>('idle');
  const [deepLink, setDeepLink] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextDeepLink = params.get('deepLink') ?? '';
    const detected = detectMobileOS(
      navigator.userAgent,
      navigator.platform,
      navigator.maxTouchPoints,
    );
    const target = getAutomaticDownloadTarget(detected);

    setDeepLink(nextDeepLink);
    setPlatform(detected);

    if (!target) return undefined;

    setRedirectState('loading');
    const countdown = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    const redirect = window.setTimeout(() => {
      try {
        window.location.assign(target);
        setRedirectState('success');
      } catch {
        setRedirectState('error');
      }
    }, 1200);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(redirect);
    };
  }, []);

  const platformLabel = useMemo(() => {
    if (platform === 'android') return 'Android detecte';
    if (platform === 'ios') return 'iPhone detecte';
    if (platform === 'unknown') return 'Mobile detecte';
    return 'Choisissez votre plateforme';
  }, [platform]);

  const statusMessage = useMemo(() => {
    if (platform === 'android') {
      return `Chrome lance le telechargement APK dans ${seconds}s. Si rien ne demarre, utilisez le bouton Android.`;
    }

    if (platform === 'ios') {
      return `Redirection App Store dans ${seconds}s. Si rien ne se passe, utilisez le bouton iPhone.`;
    }

    return 'Scannez le QR code depuis votre telephone ou choisissez directement votre plateforme.';
  }, [platform, seconds]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070A12] text-white">
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute bottom-12 right-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-pink-500 via-violet-600 to-cyan-400 shadow-2xl shadow-violet-950/40">
          <Smartphone className="h-8 w-8" />
        </div>

        <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
          {platformLabel}
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
          T&eacute;l&eacute;charger CreditTN mobile
        </h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-400">
          {statusMessage}
        </p>

        {redirectState === 'loading' && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparation du telechargement securise...
          </div>
        )}
        {redirectState === 'success' && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-bold text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            Redirection lancee.
          </div>
        )}
        {redirectState === 'error' && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-bold text-red-100">
            <TriangleAlert className="h-4 w-4" />
            Redirection impossible. Choisissez un bouton ci-dessous.
          </div>
        )}

        <div className="mt-9 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <a
            href={MOBILE_DOWNLOAD_CONFIG.androidApkUrl}
            className="group rounded-[1.7rem] border border-white/10 bg-white/[0.07] p-5 text-left shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                <Download className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-400">APK direct pour test</p>
            <p className="text-xl font-black">T&eacute;l&eacute;charger sur Android</p>
          </a>

          <a
            href={MOBILE_DOWNLOAD_CONFIG.appStoreUrl}
            className="group rounded-[1.7rem] border border-white/10 bg-white/[0.07] p-5 text-left shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:border-pink-300/40 hover:bg-pink-500/10 focus:outline-none focus:ring-2 focus:ring-pink-300/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                <Apple className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-pink-200" />
            </div>
            <p className="mt-5 text-sm font-semibold text-slate-400">Redirection store</p>
            <p className="text-xl font-black">T&eacute;l&eacute;charger sur iPhone</p>
          </a>
        </div>

        <div className="mt-4 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <a
            href={MOBILE_DOWNLOAD_CONFIG.googlePlayUrl}
            className="group rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 text-left transition-all hover:border-emerald-300/30 hover:bg-emerald-500/10"
          >
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 fill-current text-emerald-300" />
              <div>
                <p className="text-xs font-bold text-slate-500">Future production</p>
                <p className="text-sm font-black">Google Play</p>
              </div>
            </div>
          </a>

          <a
            href={deepLink || MOBILE_DOWNLOAD_CONFIG.deepLinkScheme}
            className="group rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 text-left transition-all hover:border-violet-300/30 hover:bg-violet-500/10"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-violet-300" />
              <div>
                <p className="text-xs font-bold text-slate-500">Expo / deep link</p>
                <p className="text-sm font-black">Ouvrir CreditTN</p>
              </div>
            </div>
          </a>
        </div>

        {EXPO_LINKING_PREFIXES.length > 1 && (
          <div className="mt-6 w-full max-w-2xl rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <Terminal className="h-4 w-4 text-cyan-300" />
              Expo development links
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOBILE_DOWNLOAD_CONFIG.expoGoUrl && (
                <a href={MOBILE_DOWNLOAD_CONFIG.expoGoUrl} className="rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100">
                  Expo Go
                </a>
              )}
              {MOBILE_DOWNLOAD_CONFIG.expoDevBuildUrl && (
                <a href={MOBILE_DOWNLOAD_CONFIG.expoDevBuildUrl} className="rounded-full bg-violet-300/10 px-3 py-1.5 text-xs font-bold text-violet-100">
                  Dev build
                </a>
              )}
            </div>
          </div>
        )}

        <Link href="/" className="mt-8 text-sm font-bold text-slate-500 transition hover:text-white">
          Retour a CreditTN
        </Link>
      </section>
    </main>
  );
}
