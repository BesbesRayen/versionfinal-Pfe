'use client';

import { X } from 'lucide-react';
import QRDownloadCard from '@/components/QRDownloadCard';

interface MobileAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  deepLink: string;
  title?: string;
}

export default function MobileAccessModal({ isOpen, onClose, deepLink, title }: MobileAccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
        aria-label="Fermer"
      />

      <div className="relative z-10 max-h-[94vh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#070A12] p-4 shadow-2xl shadow-black/50 sm:max-w-xl sm:rounded-[2rem]">
        <div className="flex justify-center pb-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/10 p-2 text-slate-300 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {title && (
          <div className="mb-4 pr-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">CreditTN mobile</p>
            <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
          </div>
        )}

        <QRDownloadCard deepLink={deepLink} source="mobile-access-modal" />
      </div>
    </div>
  );
}
