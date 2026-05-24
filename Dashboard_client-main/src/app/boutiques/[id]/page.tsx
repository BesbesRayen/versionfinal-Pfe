'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe2,
  Heart,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Zap,
} from 'lucide-react';
import { boutiques } from '@/data/boutiques';

function domain(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function PlanCard({ months, fee, note, featured = false }: { months: string; fee: string; note: string; featured?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        featured
          ? 'border-[#19C37D]/35 bg-[#19C37D]/10 shadow-lg shadow-[#19C37D]/10'
          : 'border-[#26324A] bg-[#151B2E]/80'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">{months}</p>
        <p className={`text-lg font-black ${featured ? 'text-[#19C37D]' : 'text-indigo-200'}`}>{fee}</p>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-400">{note}</p>
    </div>
  );
}

export default function BoutiqueDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const boutique = boutiques.find((item) => item.id === id);

  if (!boutique) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A12] px-4 pt-16 text-white">
        <div className="max-w-md rounded-[24px] border border-[#26324A] bg-[#111827] p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-slate-500" />
          <h1 className="mt-4 text-2xl font-black">Boutique introuvable</h1>
          <Link
            href="/boutiques"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#6D5DFB] px-5 py-3 text-sm font-black text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux boutiques
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A12] pt-16 text-white">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(109,93,251,0.22),transparent_25rem),radial-gradient(circle_at_75%_10%,rgba(25,195,125,0.10),transparent_28rem)]" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/boutiques"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:border-[#6D5DFB]/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <section className="overflow-hidden rounded-[24px] border border-[#26324A] bg-[#0B1020]/95 shadow-2xl shadow-black/20">
          <div className="relative p-5 sm:p-8">
            <div
              className="absolute right-0 top-0 h-52 w-52 rounded-full blur-3xl"
              style={{ backgroundColor: `${boutique.accent}24` }}
            />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
              <div>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[24px] border border-white/10 text-2xl font-black text-white shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${boutique.accent}, #151B2E 78%)`,
                      boxShadow: `0 24px 60px ${boutique.accent}22`,
                    }}
                  >
                    {boutique.logo}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6D5DFB]/30 bg-[#6D5DFB]/15 px-3 py-1.5 text-xs font-black text-indigo-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        {boutique.checkoutLabel}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${
                          boutique.isLocal
                            ? 'border-[#19C37D]/25 bg-[#19C37D]/10 text-[#19C37D]'
                            : 'border-violet-300/25 bg-violet-300/10 text-violet-200'
                        }`}
                      >
                        {boutique.isLocal ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
                        {boutique.isLocal ? 'Partenaire local' : 'International'}
                      </span>
                    </div>

                    <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">{boutique.name}</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">{boutique.longDescription}</p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-3 py-2">
                        <Store className="h-4 w-4 text-[#19C37D]" />
                        {boutique.categoryLabel}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-3 py-2">
                        <MapPin className="h-4 w-4 text-[#19C37D]" />
                        {boutique.city}, {boutique.country}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-3 py-2">
                        <Building2 className="h-4 w-4 text-[#19C37D]" />
                        {boutique.locations > 0 ? `${boutique.locations} points de vente` : 'Marketplace externe'}
                      </span>
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <a
                        href={boutique.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-[#6D5DFB] px-6 py-4 text-sm font-black text-white shadow-lg shadow-[#6D5DFB]/20 transition-colors hover:bg-[#7C6DFF]"
                      >
                        Visiter le site
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button className="inline-flex items-center justify-center gap-2 rounded-[20px] border border-[#26324A] bg-[#151B2E] px-6 py-4 text-sm font-black text-slate-200 transition-colors hover:border-pink-300/40 hover:text-pink-200">
                        <Heart className="h-4 w-4" />
                        Ajouter aux favoris
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#19C37D] text-[#06100B]">
                    <BadgePercent className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">Payer avec CreditTN</p>
                    <h2 className="text-xl font-black text-white">Plans flexibles</h2>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  <PlanCard months="3 mois" fee="0%" note="sans frais" featured />
                  <PlanCard months="6 mois" fee="+3%" note="sur le montant total" />
                  <PlanCard months="9 mois" fee="+6%" note="plan intermediaire" />
                  <PlanCard months="12 mois" fee="+12%" note="long terme" />
                </div>

                <div className="mt-5 rounded-2xl border border-[#26324A] bg-[#151B2E] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#19C37D]" />
                    <p className="text-sm leading-6 text-slate-400">
                      Conditions transparentes affichees avant validation du paiement.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">Selection boutique</p>
                <h2 className="mt-1 text-2xl font-black text-white">Produits populaires</h2>
              </div>
              <a
                href={boutique.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 text-sm font-black text-indigo-200 transition-colors hover:text-white sm:inline-flex"
              >
                Voir catalogue
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {boutique.products.map((product) => (
                <article
                  key={product.name}
                  className="group rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5 shadow-xl shadow-black/10 transition-all hover:-translate-y-1 hover:border-[#6D5DFB]/60 hover:shadow-[#6D5DFB]/10"
                >
                  <div
                    className="flex h-28 items-center justify-center rounded-[20px] border border-white/10 text-3xl font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${boutique.accent}55, #151B2E)` }}
                  >
                    {product.tag}
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">{product.tag}</p>
                    <h3 className="mt-1 min-h-[48px] text-base font-black leading-6 text-white">{product.name}</h3>
                    <p className="mt-3 text-2xl font-black text-white">{product.price}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">Eligible CreditTN 3 a 12 mois</p>
                  </div>
                  <a
                    href={boutique.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#151B2E] px-4 py-3 text-sm font-black text-slate-200 transition-colors hover:bg-[#6D5DFB] hover:text-white"
                  >
                    Voir produit
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5">
              <h3 className="text-lg font-black text-white">Informations</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Site web', value: domain(boutique.website), icon: Globe2 },
                  { label: 'Localisation', value: `${boutique.city}, ${boutique.country}`, icon: MapPin },
                  { label: 'Depuis', value: boutique.founded, icon: Clock },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-[#26324A] bg-[#151B2E] p-3">
                    <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#19C37D]" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="mt-1 truncate text-sm font-bold text-slate-200">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5">
              <h3 className="text-lg font-black text-white">Garanties CreditTN</h3>
              <div className="mt-4 space-y-3">
                {[
                  { icon: ShieldCheck, text: 'Checkout securise' },
                  { icon: Zap, text: 'Decision rapide' },
                  { icon: Star, text: 'Experience premium' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6D5DFB]/15 text-indigo-200">
                      <item.icon className="h-4 w-4" />
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
