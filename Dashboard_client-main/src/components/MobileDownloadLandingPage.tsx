'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Apple,
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Play,
  Smartphone,
  Terminal,
  TriangleAlert,
} from 'lucide-react';
import { mobileDownloadConfig } from '@/config/mobileDownloadConfig';
import { detectCurrentMobileOS, MobileOS } from '@/lib/mobile-os';
import {
  getMobileRedirectTarget,
  isValidMobileLink,
  redirectToMobileTarget,
} from '@/lib/mobile-redirect';
import { getExpoGoUrl } from '@/lib/mobile-download';

type RedirectState = 'idle' | 'loading' | 'success' | 'error';

const REDIRECT_DELAY_MS = 1000;

const osLabels: Record<MobileOS, string> = {
  android: 'Android detecte',
  ios: 'iPhone detecte',
  desktop: 'Choisissez votre plateforme',
  unknown: 'Mobile detecte',
};

export default function MobileDownloadLandingPage() {
  const [platform, setPlatform] = useState<MobileOS>('desktop');
  const [redirectState, setRedirectState] = useState<RedirectState>('idle');
  const [warning, setWarning] = useState('');
  const [deepLink, setDeepLink] = useState(mobileDownloadConfig.defaultDeepLink);

  const fallbackLinks = useMemo(() => [
    {
      label: platform === 'ios' ? 'Installer Expo Go iPhone' : 'Installer Expo Go Android',
      helper: 'Requis pour ouvrir le projet Expo',
      href: platform === 'ios'
        ? mobileDownloadConfig.expoGoIosInstallUrl
        : mobileDownloadConfig.expoGoAndroidInstallUrl,
      icon: Smartphone,
      tone: 'hover:border-cyan-300/50 hover:bg-cyan-300/10 focus-visible:ring-cyan-300/60',
    },
    {
      label: 'Ouvrir avec Expo Go',
      helper: 'Mode developpement Expo',
      href: getExpoGoUrl(deepLink),
      icon: Terminal,
      tone: 'hover:border-cyan-300/50 hover:bg-cyan-300/10 focus-visible:ring-cyan-300/60',
    },
    {
      label: 'Telecharger APK Android',
      helper: 'Build EAS preview',
      href: mobileDownloadConfig.androidApkUrl,
      icon: Download,
      tone: 'hover:border-pink-300/50 hover:bg-pink-300/10 focus-visible:ring-pink-300/60',
    },
    {
      label: 'App Store',
      helper: 'Future production iOS',
      href: mobileDownloadConfig.iosAppStoreUrl,
      icon: Apple,
      tone: 'hover:border-white/30 hover:bg-white/10 focus-visible:ring-white/50',
    },
    {
      label: 'Google Play',
      helper: 'Future production Android',
      href: mobileDownloadConfig.androidPlayStoreUrl,
      icon: Play,
      tone: 'hover:border-emerald-300/50 hover:bg-emerald-300/10 focus-visible:ring-emerald-300/60',
    },
  ], [deepLink, platform]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextDeepLink = params.get('deepLink') || mobileDownloadConfig.defaultDeepLink;
    const detected = detectCurrentMobileOS();
    const target = getMobileRedirectTarget(detected, nextDeepLink);

    setDeepLink(nextDeepLink);
    setPlatform(detected);
    setWarning(target?.warning ?? '');

    if (detected === 'desktop' || detected === 'unknown') return undefined;

    if (!target?.url) {
      setRedirectState('error');
      return undefined;
    }

    setRedirectState('loading');

    const redirectTimer = window.setTimeout(() => {
      const started = redirectToMobileTarget(target);
      setRedirectState(started ? 'success' : 'error');
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(redirectTimer);
  }, []);

  const statusCopy = useMemo(() => {
    if (redirectState === 'loading') {
      const target = getMobileRedirectTarget(platform, deepLink);
      return mobileDownloadConfig.mode === 'expo-go'
        ? "Expo Go est requis. Tentative d'ouverture du projet dans 1 seconde..."
        : `Ouverture ${target?.label ?? 'CreditTN mobile'} dans 1 seconde...`;
    }

    if (redirectState === 'success') {
      return mobileDownloadConfig.mode === 'expo-go'
        ? "Redirection lancee. Si Expo Go ne s'ouvre pas, installez Expo Go avec le bouton ci-dessous puis revenez scanner le QR."
        : 'Redirection lancee. Si rien ne se passe, choisissez un bouton ci-dessous.';
    }

    if (redirectState === 'error') {
      return warning || 'Aucun lien valide configure pour cette plateforme.';
    }

    if (platform === 'desktop') {
      return 'Scannez le QR code depuis votre telephone ou choisissez une option de telechargement.';
    }

    return 'Choisissez la meilleure option pour votre appareil.';
  }, [deepLink, platform, redirectState, warning]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute left-1/2 top-12 h-80 w-80 -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute left-8 top-1/3 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-pink-500 via-violet-600 to-cyan-400 shadow-2xl shadow-violet-950/50"
        >
          <Smartphone className="h-8 w-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="mt-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200"
        >
          {osLabels[platform]} - {mobileDownloadConfig.mode}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.45 }}
          className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl"
        >
          Ouverture de CreditTN mobile
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.45 }}
          className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-slate-400"
        >
          {statusCopy}
        </motion.p>

        {warning && (
          <div className="mt-6 inline-flex max-w-2xl items-start gap-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-left text-sm font-bold text-amber-100">
            <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {mobileDownloadConfig.mode === 'expo-go' && (
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a
              href={mobileDownloadConfig.expoGoIosInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5"
            >
              <Apple className="h-4 w-4" />
              Installer Expo Go iPhone
            </a>
            <a
              href={mobileDownloadConfig.expoGoAndroidInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100 shadow-lg transition hover:-translate-y-0.5"
            >
              <Play className="h-4 w-4 fill-current" />
              Installer Expo Go Android
            </a>
          </div>
        )}

        {redirectState === 'loading' && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparation de la redirection...
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
            Utilisez un lien manuel ci-dessous.
          </div>
        )}

        <div className="mt-9 grid w-full max-w-4xl gap-4 sm:grid-cols-2">
          {fallbackLinks.map((link) => {
            const Icon = link.icon;
            const valid = isValidMobileLink(link.href);

            return (
              <a
                key={link.label}
                href={valid ? link.href : '#'}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                aria-disabled={!valid}
                onClick={(event) => {
                  if (!valid) event.preventDefault();
                }}
                className={`group rounded-[1.7rem] border border-white/10 bg-white/[0.07] p-5 text-left shadow-2xl shadow-black/20 transition-all focus:outline-none focus-visible:ring-2 ${
                  valid ? `hover:-translate-y-1 ${link.tone}` : 'cursor-not-allowed opacity-40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" />
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-400">{link.helper}</p>
                <p className="text-xl font-black">{link.label}</p>
              </a>
            );
          })}
        </div>

        <div className="mt-6 w-full max-w-4xl rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <Terminal className="h-4 w-4 text-cyan-300" />
            Notes Expo
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            <strong className="text-white">Expo Go est requis</strong> en mode <strong className="text-white">expo-go</strong>.
            Le QR ouvre le projet dans Expo Go et ne telecharge pas un APK.
            Pour un vrai telechargement Android, genere un build avec{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-100">eas build -p android --profile preview</code>,
            heberge le fichier APK, puis passe le mode a <strong className="text-white">apk</strong>.
          </p>
        </div>

        <Link href="/" className="mt-8 text-sm font-bold text-slate-500 transition hover:text-white">
          Retour a CreditTN
        </Link>
      </section>
    </main>
  );
}
