import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { boutiques } from '@/data/boutiques';

export default function PartnersPreview() {
  const previewBoutiques = boutiques.filter((b) => b.conventionActive !== false).slice(0, 6);

  return (
    <section className="section-padding bg-[#0b1120]" id="partners">
      <div className="container-custom mx-auto">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2">
            <span className="text-sm font-medium text-indigo-200">Nos partenaires</span>
          </div>
          <h2 className="mb-6 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Boutiques partenaires{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
              CreditTN
            </span>
          </h2>
          <p className="text-lg leading-relaxed text-slate-400">
            Decouvrez ou utiliser CreditTN pour vos achats echelonnes. Plus de 100 boutiques vous
            attendent dans toute la Tunisie.
          </p>
        </div>

        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {previewBoutiques.map((boutique) => (
            <div
              key={boutique.id}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:border-indigo-300/30 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-black/20"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/20 text-3xl transition-transform duration-300 group-hover:scale-105">
                  {boutique.logo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-display text-lg font-bold text-white">{boutique.name}</h3>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" title="Convention active" />
                  </div>
                  <span className="mb-2 inline-block rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-200">
                    {boutique.category}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-sm">{boutique.city}</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-400">
                {boutique.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/boutiques" className="btn-primary gap-2 text-base !px-8 !py-4">
            Voir toutes les boutiques
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
