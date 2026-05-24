'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Heart,
  Laptop,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Zap,
} from 'lucide-react';
import { Boutique, BoutiqueCategory, boutiques, categories } from '@/data/boutiques';

const categoryMeta: Record<BoutiqueCategory, { icon: typeof Laptop; color: string }> = {
  Informatique: { icon: Laptop, color: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20' },
  Beaute: { icon: Sparkles, color: 'text-pink-300 bg-pink-300/10 border-pink-300/20' },
  International: { icon: Globe2, color: 'text-violet-300 bg-violet-300/10 border-violet-300/20' },
};

function domain(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function OfferPanel() {
  const plans = [
    { title: '3 mois', value: '0%', text: 'sans frais', tone: 'border-[#19C37D]/30 bg-[#19C37D]/10 text-[#19C37D]' },
    { title: '6 mois', value: '+3%', text: 'populaire', tone: 'border-[#6D5DFB]/35 bg-[#6D5DFB]/10 text-indigo-200' },
    { title: '12 mois', value: '+12%', text: 'long terme', tone: 'border-amber-300/25 bg-amber-300/10 text-amber-200' },
  ];

  return (
    <aside className="rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">Offre visible checkout</p>
          <h2 className="mt-2 text-2xl font-black text-white">3% sur 6 mois</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Paiement flexible avec conditions transparentes.
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#19C37D] text-[#07110C] shadow-lg shadow-[#19C37D]/20">
          <BadgePercent className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {plans.map((plan) => (
          <div key={plan.title} className={`rounded-2xl border p-4 ${plan.tone}`}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black text-white">{plan.title}</p>
              <p className="text-xl font-black">{plan.value}</p>
            </div>
            <p className="mt-1 text-xs font-semibold opacity-80">{plan.text}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function BoutiqueCard({
  boutique,
  favorite,
  onToggleFavorite,
}: {
  boutique: Boutique;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const Icon = categoryMeta[boutique.category].icon;

  return (
    <article className="group rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-[#6D5DFB]/70 hover:shadow-[#6D5DFB]/10">
      <div className="flex items-start justify-between gap-4">
        <Link href={`/boutiques/${boutique.id}`} className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 text-sm font-black text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${boutique.accent}, #151B2E 78%)`,
              boxShadow: `0 18px 44px ${boutique.accent}24`,
            }}
          >
            {boutique.logo}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-white">{boutique.name}</h3>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-400">{boutique.categoryLabel}</p>
          </div>
        </Link>

        <button
          onClick={onToggleFavorite}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
            favorite
              ? 'border-pink-300/30 bg-pink-400/15 text-pink-300'
              : 'border-[#26324A] bg-[#151B2E] text-slate-400 hover:border-pink-300/30 hover:text-pink-300'
          }`}
          aria-label="Ajouter aux favoris"
        >
          <Heart className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${categoryMeta[boutique.category].color}`}>
          <Icon className="h-3.5 w-3.5" />
          {boutique.category}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${
          boutique.isLocal
            ? 'border-[#19C37D]/25 bg-[#19C37D]/10 text-[#19C37D]'
            : 'border-[#6D5DFB]/30 bg-[#6D5DFB]/10 text-indigo-200'
        }`}>
          {boutique.isLocal ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
          {boutique.isLocal ? 'Partenaire local' : 'International'}
        </span>
      </div>

      <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-400">{boutique.description}</p>

      <div className="mt-5 rounded-2xl border border-[#26324A] bg-[#151B2E]/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-200">{domain(boutique.website)}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{boutique.checkoutLabel}</p>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#19C37D]" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
        <Link
          href={`/boutiques/${boutique.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6D5DFB] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#6D5DFB]/20 transition-colors hover:bg-[#7C6DFF]"
        >
          Voir boutique
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={boutique.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#26324A] bg-[#151B2E] text-slate-300 transition-colors hover:border-[#19C37D]/50 hover:text-[#19C37D]"
          aria-label={`Ouvrir ${boutique.name}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

export default function BoutiquesPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Toutes');
  const [favorites, setFavorites] = useState<number[]>([]);

  const filteredBoutiques = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boutiques.filter((boutique) => {
      const matchesQuery =
        !q ||
        boutique.name.toLowerCase().includes(q) ||
        boutique.category.toLowerCase().includes(q) ||
        boutique.categoryLabel.toLowerCase().includes(q) ||
        boutique.description.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'Toutes' ||
        (selectedCategory === 'Favoris' ? favorites.includes(boutique.id) : boutique.category === selectedCategory);
      return matchesQuery && matchesCategory;
    });
  }, [favorites, query, selectedCategory]);

  const toggleFavorite = (id: number) => {
    setFavorites((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="min-h-screen bg-[#070A12] pt-16 text-white">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(109,93,251,0.20),transparent_26rem),radial-gradient(circle_at_top_right,rgba(25,195,125,0.12),transparent_28rem)]" />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2 overflow-x-auto text-sm font-bold text-slate-400 scrollbar-hide">
          <span className="text-slate-500">Dashboard</span>
          <span>/</span>
          <span className="text-white">Shopping / Boutiques</span>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[24px] border border-[#26324A] bg-[#0B1020]/90 p-5 shadow-2xl shadow-black/20 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#6D5DFB]/30 bg-[#6D5DFB]/15 px-3 py-1.5 text-xs font-black text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" />
                Marketplace CreditTN
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#19C37D]/25 bg-[#19C37D]/10 px-3 py-1.5 text-xs font-black text-[#19C37D]">
                <Zap className="h-3.5 w-3.5" />
                Paiement flexible disponible
              </span>
            </div>

            <div className="mt-8 max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Achetez maintenant, payez plus tard
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Decouvrez les boutiques compatibles CreditTN en Tunisie et a l international.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher une boutique, produit ou categorie..."
                  className="h-16 w-full rounded-[24px] border border-[#26324A] bg-[#151B2E] pl-14 pr-5 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-[#6D5DFB] focus:ring-4 focus:ring-[#6D5DFB]/10"
                />
              </div>
              <a
                href="#boutiques-grid"
                className="inline-flex h-16 items-center justify-center gap-2 rounded-[24px] bg-[#19C37D] px-6 text-sm font-black text-[#06100B] shadow-lg shadow-[#19C37D]/20 transition-colors hover:bg-[#26D88F]"
              >
                Explorer les boutiques
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-black transition-all ${
                    selectedCategory === category
                      ? 'border-[#6D5DFB] bg-[#6D5DFB] text-white shadow-lg shadow-[#6D5DFB]/20'
                      : 'border-[#26324A] bg-[#111827] text-slate-300 hover:border-[#19C37D]/50 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ['10+ boutiques', Store],
                ['3 a 12 mois', BadgePercent],
                ['Decision rapide', ShieldCheck],
              ].map(([label, Icon]) => (
                <div key={String(label)} className="rounded-2xl border border-[#26324A] bg-[#111827]/80 p-4">
                  <Icon className="h-5 w-5 text-[#19C37D]" />
                  <p className="mt-3 text-sm font-black text-white">{String(label)}</p>
                </div>
              ))}
            </div>
          </div>

          <OfferPanel />
        </section>

        <section id="boutiques-grid" className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">Shopping / Boutiques</p>
              <h2 className="mt-1 text-2xl font-black text-white">{filteredBoutiques.length} boutiques disponibles</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-4 py-2 text-xs font-bold text-slate-300">
              <Star className="h-3.5 w-3.5 text-amber-300" />
              Experience checkout premium
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredBoutiques.map((boutique) => (
              <BoutiqueCard
                key={boutique.id}
                boutique={boutique}
                favorite={favorites.includes(boutique.id)}
                onToggleFavorite={() => toggleFavorite(boutique.id)}
              />
            ))}
          </div>

          {filteredBoutiques.length === 0 && (
            <div className="rounded-[24px] border border-[#26324A] bg-[#111827] p-10 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-slate-500" />
              <h3 className="mt-4 text-xl font-black text-white">Aucune boutique trouvee</h3>
              <p className="mt-2 text-sm text-slate-400">Essayez une autre recherche ou un autre filtre.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
