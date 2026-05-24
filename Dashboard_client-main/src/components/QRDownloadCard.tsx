'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import {
  getMobileDownloadLandingUrl,
  getQrCodeImageUrl,
  isValidHttpUrl,
  MOBILE_DOWNLOAD_CONFIG,
} from '@/lib/mobile-download';

type QrStatus = 'loading' | 'ready' | 'success' | 'error';

interface QRDownloadCardProps {
  deepLink?: string;
  source?: string;
}

export default function QRDownloadCard({ deepLink, source = 'homepage-qr' }: QRDownloadCardProps) {
  const [downloadUrl, setDownloadUrl] = useState<string>(MOBILE_DOWNLOAD_CONFIG.landingPath);
  const [status, setStatus] = useState<QrStatus>('loading');

  useEffect(() => {
    const id = window.setTimeout(() => {
      const nextUrl = getMobileDownloadLandingUrl(window.location.origin, { deepLink, source });
      setDownloadUrl(nextUrl);
      setStatus(isValidHttpUrl(nextUrl) ? 'loading' : 'error');
    }, 0);

    return () => window.clearTimeout(id);
  }, [deepLink, source]);

  const qrSrc = useMemo(() => getQrCodeImageUrl(downloadUrl, 280), [downloadUrl]);

  const markSuccess = () => {
    if (status !== 'error') {
      setStatus('success');
    }
  };

  const retryQr = () => {
    setStatus('loading');
    setDownloadUrl(getMobileDownloadLandingUrl(window.location.origin, { deepLink, source }));
  };

  return (
    <div className="group relative animate-slide-up">
      <div className="absolute -inset-1 rounded-[2.25rem] bg-gradient-to-br from-pink-500/50 via-violet-500/35 to-cyan-400/45 opacity-70 blur-2xl transition duration-500 group-hover:opacity-100" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-5">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-pink-400/20 via-violet-500/20 to-cyan-300/20" />

        <div className="relative rounded-[1.6rem] border border-pink-100/70 bg-gradient-to-br from-white via-pink-50 to-cyan-50 p-5 text-slate-950 shadow-2xl shadow-pink-950/20 transition-transform duration-300 group-hover:-translate-y-1 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
              <QrCode className="h-3.5 w-3.5 text-cyan-300" />
              Scan mobile
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-black text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Expo ready
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-black tracking-tight text-slate-950">
              Scannez pour t&eacute;l&eacute;charger l&apos;application
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
              Ouvrez l&apos;appareil photo de votre t&eacute;l&eacute;phone et scannez le QR code
            </p>
          </div>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={markSuccess}
            className="mx-auto mt-6 block rounded-[1.75rem] bg-white p-4 shadow-xl shadow-slate-900/15 outline-none ring-1 ring-slate-200 transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-cyan-300/60"
            aria-label="QR code vers la page de telechargement mobile CreditTN"
          >
            <div className="relative flex h-60 w-60 items-center justify-center sm:h-64 sm:w-64">
              {status === 'loading' && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                </div>
              )}

              {status === 'error' ? (
                <div className="flex h-full w-full flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
                  <TriangleAlert className="h-9 w-9 text-red-500" />
                  <p className="mt-3 text-sm font-black text-red-700">QR indisponible</p>
                  <p className="mt-1 text-xs font-semibold text-red-500">Utilisez les boutons de telechargement.</p>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrSrc}
                  alt="QR code CreditTN ouvrant la page de telechargement mobile"
                  className="h-full w-full rounded-2xl"
                  loading="lazy"
                  onLoad={() => setStatus((current) => (current === 'loading' ? 'ready' : current))}
                  onError={() => setStatus('error')}
                />
              )}

              {status === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-950/88 text-white backdrop-blur-sm">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
                    <p className="mt-2 text-sm font-black">QR pret</p>
                    <p className="text-xs font-medium text-slate-300">Page ouverte</p>
                  </div>
                </div>
              )}
            </div>
          </a>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white">App Store</span>
            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white">Google Play</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href={MOBILE_DOWNLOAD_CONFIG.androidApkUrl}
              onClick={markSuccess}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              T&eacute;l&eacute;charger sur Android
            </a>
            <a
              href={MOBILE_DOWNLOAD_CONFIG.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markSuccess}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <Smartphone className="h-4 w-4" />
              T&eacute;l&eacute;charger sur iPhone
            </a>
          </div>
        </div>

        <div className="relative mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />}
            {status === 'ready' && <QrCode className="h-4 w-4 text-cyan-300" />}
            {status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            {status === 'error' && <TriangleAlert className="h-4 w-4 text-red-300" />}
            {status === 'loading' && 'Generation du QR code'}
            {status === 'ready' && 'QR code pret a scanner'}
            {status === 'success' && 'Redirection prete'}
            {status === 'error' && 'Fallback disponible'}
          </span>
          <button
            type="button"
            onClick={retryQr}
            className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Regenerer le QR code"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
