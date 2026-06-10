'use client';

import { Smartphone, Star } from 'lucide-react';
import QRDownloadCard from '@/components/QRDownloadCard';
import { MOBILE_DOWNLOAD_CONFIG } from '@/lib/mobile-download';

const APP_STORE_URL = MOBILE_DOWNLOAD_CONFIG.appStoreUrl;
const PLAY_STORE_URL = MOBILE_DOWNLOAD_CONFIG.googlePlayUrl;

export default function DownloadCTA() {
  return (
    <section id="mobile-app-download" className="section-padding scroll-mt-20 relative overflow-hidden bg-slate-950">
      <div className="absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-pink-500/15 blur-3xl" />
      <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="container-custom mx-auto relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Smartphone className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-medium text-cyan-100">Application mobile</span>
            </div>

            <div>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Continuez vos achats sur <span className="text-cyan-300">CreditTN mobile</span>
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-300">
                Paiements, boutiques, echeances et verification KYC depuis une experience mobile rapide et securisee.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-gray-400">4.8/5 - Plus de 10 000 avis</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <StoreButton href={APP_STORE_URL} label="Telecharger sur" store="App Store" kind="apple" />
              <StoreButton href={PLAY_STORE_URL} label="Disponible sur" store="Google Play" kind="play" />
            </div>
          </div>

          <QRDownloadCard />
        </div>
      </div>
    </section>
  );
}

function StoreButton({
  href,
  label,
  store,
  kind,
}: {
  href: string;
  label: string;
  store: string;
  kind: 'apple' | 'play';
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 rounded-xl bg-white px-6 py-4 font-semibold text-slate-950 shadow-lg transition-colors hover:bg-cyan-50"
    >
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {kind === 'apple' ? (
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        ) : (
          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
        )}
      </svg>
      <div className="text-left">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-bold">{store}</p>
      </div>
    </a>
  );
}
