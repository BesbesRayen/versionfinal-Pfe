'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Heart,
  Laptop,
  Loader2,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Zap,
} from 'lucide-react';
import { BACKEND, CreditPlan, PublicStore, getCreditPlans, getPublicStores } from '@/lib/api';

function domain(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('');
}

function imageSrc(src?: string) {
  if (!src) return '';
  return src.startsWith('/') ? `${BACKEND}${src}` : src;
}

function isBlockedGeneratedCover(src?: string) {
  return Boolean(src && src.includes('image.thum.io'));
}

function CoverFallback({ name, category }: { name: string; category: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(109,93,251,0.20)),radial-gradient(circle_at_80%_20%,rgba(25,195,125,0.20),transparent_12rem)]">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-black text-cyan-100 backdrop-blur">
        {category}
      </div>
      <div className="absolute bottom-7 right-6 text-right text-5xl font-black text-white/10">
        {initials(name) || 'TN'}
      </div>
    </div>
  );
}

function OfferPanel({ plans }: { plans: CreditPlan[] }) {
  const highlighted = plans.find((plan) => plan.months === 6) ?? plans[0];
  return (
    <aside className="rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">Offre visible checkout</p>
          <h2 className="mt-2 text-2xl font-black text-white">{highlighted?.feeLabel ?? '0%'} sur {highlighted?.label ?? '3 mois'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Memes plans CreditTN que sur mobile et checkout.</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#19C37D] text-[#07110C] shadow-lg shadow-[#19C37D]/20">
          <BadgePercent className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {plans.map((plan) => (
          <div key={plan.months} className={`rounded-2xl border p-4 ${
            plan.recommended
              ? 'border-[#19C37D]/30 bg-[#19C37D]/10 text-[#19C37D]'
              : plan.months === 6
                ? 'border-[#6D5DFB]/35 bg-[#6D5DFB]/10 text-indigo-200'
                : 'border-amber-300/25 bg-amber-300/10 text-amber-200'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-black text-white">{plan.label}</p>
              <p className="text-xl font-black">{plan.feeLabel}</p>
            </div>
            <p className="mt-1 text-xs font-semibold opacity-80">{plan.description}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function BoutiqueCard({
  storeItem,
  favorite,
  onToggleFavorite,
}: {
  storeItem: PublicStore;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(storeItem.coverImageUrl && !isBlockedGeneratedCover(storeItem.coverImageUrl) && !coverFailed);

  return (
    <article className="group overflow-hidden rounded-[28px] border border-[#26324A] bg-[#111827]/90 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-[#6D5DFB]/70 hover:shadow-[#6D5DFB]/10">
      <Link href={`/boutiques/${storeItem.slug || storeItem.id}`} className="relative block h-36 overflow-hidden bg-[#151B2E]">
        {showCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc(storeItem.coverImageUrl)} alt="" onError={() => setCoverFailed(true)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <CoverFallback name={storeItem.name} category={storeItem.category} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/20 to-transparent" />
        <div className="absolute bottom-4 left-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-slate-950/80 text-sm font-black text-white shadow-xl backdrop-blur">
            {storeItem.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc(storeItem.logoUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(storeItem.name)
            )}
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-white">{storeItem.name}</h3>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-400">{storeItem.category}</p>
          </div>

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
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-200">
          <Laptop className="h-3.5 w-3.5" />
          {storeItem.category}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#19C37D]/25 bg-[#19C37D]/10 px-3 py-1.5 text-xs font-black text-[#19C37D]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Catalogue actif
        </span>
      </div>

      <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-400">
        {storeItem.articleCount} article{storeItem.articleCount > 1 ? 's' : ''} disponible{storeItem.articleCount > 1 ? 's' : ''} avec paiement CreditTN.
      </p>

      <div className="mt-5 rounded-2xl border border-[#26324A] bg-[#151B2E]/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-200">{domain(storeItem.websiteUrl)}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">CreditTN checkout</p>
          </div>
          <ShieldCheck className="h-5 w-5 shrink-0 text-[#19C37D]" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
        <Link
          href={`/boutiques/${storeItem.slug || storeItem.id}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6D5DFB] px-4 py-3 text-sm font-black text-white shadow-lg shadow-[#6D5DFB]/20 transition-colors hover:bg-[#7C6DFF]"
        >
          Voir boutique
          <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href={storeItem.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#26324A] bg-[#151B2E] text-slate-300 transition-colors hover:border-[#19C37D]/50 hover:text-[#19C37D]"
          aria-label={`Ouvrir ${storeItem.name}`}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      </div>
    </article>
  );
}

export default function BoutiquesPage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPublicStores(), getCreditPlans()])
      .then(([storeData, planData]) => {
        setStores(storeData);
        setPlans(planData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Impossible de charger les boutiques.'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['Toutes', ...Array.from(new Set(stores.map((item) => item.category))).sort(), 'Favoris'], [stores]);

  const filteredStores = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stores.filter((storeItem) => {
      const matchesQuery =
        !q ||
        storeItem.name.toLowerCase().includes(q) ||
        storeItem.category.toLowerCase().includes(q) ||
        domain(storeItem.websiteUrl).toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'Toutes' ||
        (selectedCategory === 'Favoris' ? favorites.includes(String(storeItem.id)) : storeItem.category === selectedCategory);
      return matchesQuery && matchesCategory;
    });
  }, [favorites, query, selectedCategory, stores]);

  const toggleFavorite = (id: string) => {
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

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="relative overflow-hidden rounded-[32px] border border-[#26324A] bg-[#0B1020]/90 p-5 shadow-2xl shadow-black/20 sm:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,93,251,0.18),transparent_44%),radial-gradient(circle_at_84%_18%,rgba(25,195,125,0.18),transparent_22rem)]" />
            <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#6D5DFB]/30 bg-[#6D5DFB]/15 px-3 py-1.5 text-xs font-black text-indigo-200">
                <Sparkles className="h-3.5 w-3.5" />
                Marketplace CreditTN
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#19C37D]/25 bg-[#19C37D]/10 px-3 py-1.5 text-xs font-black text-[#19C37D]">
                <Zap className="h-3.5 w-3.5" />
                Catalogue synchronise
              </span>
            </div>

            <div className="mt-8 max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Achetez maintenant, payez plus tard
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
                Decouvrez les boutiques alimentees par les articles ajoutes depuis le dashboard admin.
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
                [`${stores.length} boutiques`, Store],
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
          </div>

          <OfferPanel plans={plans} />
        </section>

        <section id="boutiques-grid" className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">Shopping / Boutiques</p>
              <h2 className="mt-1 text-2xl font-black text-white">{filteredStores.length} boutiques disponibles</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-4 py-2 text-xs font-bold text-slate-300">
              <Star className="h-3.5 w-3.5 text-amber-300" />
              Experience checkout premium
            </div>
          </div>

          {loading && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-[24px] border border-[#26324A] bg-[#111827]/80" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-[24px] border border-red-400/25 bg-red-500/10 p-6 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredStores.map((storeItem) => (
                <BoutiqueCard
                  key={storeItem.id}
                  storeItem={storeItem}
                  favorite={favorites.includes(String(storeItem.id))}
                  onToggleFavorite={() => toggleFavorite(String(storeItem.id))}
                />
              ))}
            </div>
          )}

          {!loading && !error && filteredStores.length === 0 && (
            <div className="rounded-[24px] border border-[#26324A] bg-[#111827] p-10 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-slate-500" />
              <h3 className="mt-4 text-xl font-black text-white">Aucune boutique trouvee</h3>
              <p className="mt-2 text-sm text-slate-400">Ajoutez des articles depuis l&apos;admin pour alimenter cette page.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
