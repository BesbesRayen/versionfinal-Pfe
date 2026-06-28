'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Play,
  QrCode,
  RefreshCw,
  Smartphone,
  Terminal,
  TriangleAlert,
} from 'lucide-react';
import { mobileDownloadConfig } from '@/config/mobileDownloadConfig';
import {
  getExpoGoUrl,
  getMobileDownloadLandingUrl,
  getMobileWebUrl,
} from '@/lib/mobile-download';
import { isValidMobileLink } from '@/lib/mobile-redirect';

type QrStatus = 'loading' | 'ready' | 'success' | 'error';

interface QRDownloadCardProps {
  deepLink?: string;
  source?: string;
}

const statusCopy: Record<QrStatus, string> = {
  loading: 'Generation du QR code',
  ready: 'QR code pret a scanner',
  success: 'Lien ouvert',
  error: 'Lien QR a configurer',
};

const modeBadges = {
  'expo-go': {
    icon: Terminal,
    label: 'Expo Go',
    className: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100',
  },
  apk: {
    icon: Download,
    label: 'Android APK',
    className: 'border-pink-300/25 bg-pink-300/10 text-pink-100',
  },
  production: {
    icon: Smartphone,
    label: 'Stores',
    className: 'border-violet-300/25 bg-violet-300/10 text-violet-100',
  },
} as const;

export default function QRDownloadCard({ deepLink = mobileDownloadConfig.defaultDeepLink, source = 'homepage-qr' }: QRDownloadCardProps) {
  const [downloadUrl, setDownloadUrl] = useState(mobileDownloadConfig.downloadLandingUrl);
  const [status, setStatus] = useState<QrStatus>('loading');

  const activeBadge = modeBadges[mobileDownloadConfig.mode];
  const BadgeIcon = activeBadge.icon;

  const fallbackLinks = useMemo(() => [
    {
      label: 'Installer Expo Go',
      href: mobileDownloadConfig.expoGoAndroidInstallUrl,
      icon: Smartphone,
      tone: 'hover:border-cyan-300/50 hover:bg-cyan-300/10 focus-visible:ring-cyan-300/60',
    },
    {
      label: 'Ouvrir avec Expo Go',
      href: getExpoGoUrl(deepLink),
      icon: Terminal,
      tone: 'hover:border-cyan-300/50 hover:bg-cyan-300/10 focus-visible:ring-cyan-300/60',
    },
    {
      label: 'Google Play',
      href: mobileDownloadConfig.androidPlayStoreUrl,
      icon: Play,
      tone: 'hover:border-emerald-300/50 hover:bg-emerald-300/10 focus-visible:ring-emerald-300/60',
    },
  ], [deepLink]);

  const refreshQr = () => {
    setStatus('loading');
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    const mobileWebUrl = getMobileWebUrl(origin);
    const nextUrl = mobileDownloadConfig.mode === 'expo-go' && mobileWebUrl
      ? mobileWebUrl
      : getMobileDownloadLandingUrl(origin, { deepLink, source });
    setDownloadUrl(nextUrl);

    window.setTimeout(() => {
      setStatus(nextUrl ? 'ready' : 'error');
    }, 380);
  };

  useEffect(() => {
    refreshQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink, source]);

  const markSuccess = () => {
    if (status !== 'error') setStatus('success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.32 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="group relative"
    >
      <div className="absolute -inset-1 rounded-[2.4rem] bg-gradient-to-br from-pink-500/55 via-violet-500/35 to-cyan-400/55 opacity-80 blur-2xl transition duration-500 group-hover:opacity-100" />

      <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/45 backdrop-blur-2xl sm:p-5">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-pink-400/20 via-violet-500/18 to-cyan-300/20" />
        <div className="absolute -right-8 top-10 h-28 w-28 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="absolute -bottom-8 left-6 h-36 w-36 rounded-full bg-pink-400/15 blur-2xl" />

        <div className="relative flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-2 text-xs font-black text-white">
            <QrCode className="h-4 w-4 text-cyan-300" />
            CreditTN mobile
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${activeBadge.className}`}>
            <BadgeIcon className="h-4 w-4" />
            {activeBadge.label}
          </div>
        </div>

        <div className="relative mt-5 rounded-[1.8rem] border border-white/80 bg-gradient-to-br from-white via-pink-50 to-cyan-50 p-5 text-slate-950 shadow-2xl shadow-pink-950/20 sm:p-6">
          <div className="text-center">
            <h3 className="text-2xl font-black tracking-tight text-slate-950">
              Scannez pour ouvrir l&apos;application
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-relaxed text-slate-500">
              Scannez ce QR code avec votre telephone pour ouvrir ou telecharger CreditTN mobile
            </p>
          </div>

          <a
            href={downloadUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={markSuccess}
            className="mx-auto mt-6 block w-fit rounded-[1.75rem] bg-white p-4 shadow-xl shadow-slate-900/15 outline-none ring-1 ring-slate-200 transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-cyan-300/60"
            aria-label="QR code vers la page mobile CreditTN"
          >
            <div className="relative flex h-60 w-60 items-center justify-center sm:h-64 sm:w-64">
              {status === 'error' ? (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
                  <TriangleAlert className="h-9 w-9 text-red-500" />
                  <p className="mt-3 text-sm font-black text-red-700">QR indisponible</p>
                  <p className="mt-1 text-xs font-semibold text-red-500">Configurez downloadLandingUrl.</p>
                </div>
              ) : (
                <QRCodeSVG
                  value={downloadUrl}
                  size={256}
                  level="H"
                  marginSize={2}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  className="h-full w-full rounded-2xl"
                  title="QR code CreditTN mobile"
                />
              )}

              {status === 'loading' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/96 text-slate-950 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                  <span className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Preparation</span>
                </div>
              )}

              {status === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-950/88 text-white backdrop-blur-sm">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
                    <p className="mt-2 text-sm font-black">Lien ouvert</p>
                    <p className="text-xs font-medium text-slate-300">Utilisez le bouton retour si besoin</p>
                  </div>
                </div>
              )}
            </div>
          </a>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
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
                    else markSuccess();
                  }}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-center text-xs font-black text-white shadow-lg shadow-slate-900/15 transition-all focus:outline-none focus-visible:ring-2 ${
                    valid ? link.tone : 'cursor-not-allowed opacity-40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        <div className="relative mt-4 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-300">
            <span className="flex min-w-0 items-center gap-2">
              {status === 'loading' && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-cyan-300" />}
              {status === 'ready' && <QrCode className="h-4 w-4 flex-shrink-0 text-cyan-300" />}
              {status === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-300" />}
              {status === 'error' && <TriangleAlert className="h-4 w-4 flex-shrink-0 text-red-300" />}
              <span className="truncate">{statusCopy[status]}</span>
            </span>
            <button
              type="button"
              onClick={refreshQr}
              className="flex-shrink-0 rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
              aria-label="Regenerer le QR code"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left">
            <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-200" />
            <p className="text-[11px] font-semibold leading-relaxed text-slate-400">
              Sur le reseau local, le QR ouvre directement CreditTN mobile dans le navigateur. Pour un vrai telechargement Android, genere un APK avec{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-100">eas build -p android --profile preview</code>.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
