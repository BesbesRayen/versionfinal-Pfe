'use client';

import { useEffect } from 'react';

export default function LegacyDownloadPage() {
  useEffect(() => {
    window.location.replace(`/mobile-download${window.location.search}`);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-center text-white">
      <p className="text-sm font-bold text-slate-400">Redirection vers CreditTN mobile...</p>
    </main>
  );
}
