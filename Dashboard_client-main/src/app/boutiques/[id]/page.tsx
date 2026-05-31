'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import MobileAccessModal from '@/components/MobileAccessModal';
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
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Zap,
} from 'lucide-react';
import { BACKEND, CreditPlan, PublicArticle, PublicStore, getCreditPlans, getPublicStore, getPublicStoreArticles } from '@/lib/api';

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

function imageSrc(src: string) {
  if (!src) return '';
  return src.startsWith('/') ? `${BACKEND}${src}` : src;
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

function eligibilityText(article: PublicArticle) {
  const months = [
    article.eligibleThreeMonths !== false ? '3' : null,
    article.eligibleSixMonths !== false ? '6' : null,
    article.eligibleTwelveMonths !== false ? '12' : null,
  ].filter(Boolean);

  return months.length > 0 ? `Eligible CreditTN ${months.join(', ')} mois` : 'Eligibilite a verifier';
}

export default function BoutiqueDetailPage() {
  const params = useParams();
  const id = String(params.id ?? '');
  const [storeItem, setStoreItem] = useState<PublicStore | null>(null);
  const [articles, setArticles] = useState<PublicArticle[]>([]);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileModal, setMobileModal] = useState<{ open: boolean; link: string; name: string }>({
    open: false,
    link: '',
    name: '',
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [storeData, articleData, planData] = await Promise.all([
          getPublicStore(id),
          getPublicStoreArticles(id),
          getCreditPlans(),
        ]);
        setStoreItem(storeData);
        setArticles(articleData);
        setPlans(planData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Boutique introuvable.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A12] px-4 pt-16 text-white">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-cyan-200" />
        Chargement de la boutique...
      </div>
    );
  }

  if (error || !storeItem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070A12] px-4 pt-16 text-white">
        <div className="max-w-md rounded-[24px] border border-[#26324A] bg-[#111827] p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-slate-500" />
          <h1 className="mt-4 text-2xl font-black">Boutique introuvable</h1>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <Link href="/boutiques" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#6D5DFB] px-5 py-3 text-sm font-black text-white">
            <ArrowLeft className="h-4 w-4" />
            Retour aux boutiques
          </Link>
        </div>
      </div>
    );
  }

  const openProductInApp = (product: PublicArticle) => {
    const params = new URLSearchParams({
      articleId: String(product.id),
      shopName: storeItem.name,
    });
    setMobileModal({
      open: true,
      link: `creditn://product?${params.toString()}`,
      name: product.productName,
    });
  };

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
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
              <div>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-cyan-400 to-indigo-600 text-2xl font-black text-white shadow-2xl shadow-cyan-950/30">
                    {storeItem.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc(storeItem.logoUrl)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials(storeItem.name)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6D5DFB]/30 bg-[#6D5DFB]/15 px-3 py-1.5 text-xs font-black text-indigo-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        CreditTN checkout
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#19C37D]/25 bg-[#19C37D]/10 px-3 py-1.5 text-xs font-black text-[#19C37D]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Catalogue actif
                      </span>
                    </div>

                    <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">{storeItem.name}</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
                      Retrouvez les articles CreditTN disponibles dans cette boutique, synchronises depuis le dashboard admin.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-400">
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-3 py-2">
                        <Store className="h-4 w-4 text-[#19C37D]" />
                        {storeItem.category}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-3 py-2">
                        <MapPin className="h-4 w-4 text-[#19C37D]" />
                        {storeItem.country}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#26324A] bg-[#111827] px-3 py-2">
                        <Building2 className="h-4 w-4 text-[#19C37D]" />
                        {storeItem.articleCount} articles
                      </span>
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <a
                        href={storeItem.websiteUrl}
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
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.months}
                      months={plan.label}
                      fee={plan.feeLabel}
                      note={plan.description}
                      featured={plan.recommended}
                    />
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-[#26324A] bg-[#151B2E] p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#19C37D]" />
                    <p className="text-sm leading-6 text-slate-400">Conditions transparentes affichees avant validation du paiement.</p>
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
                href={storeItem.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 text-sm font-black text-indigo-200 transition-colors hover:text-white sm:inline-flex"
              >
                Voir catalogue
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {articles.map((product) => (
                <article
                  key={product.id}
                  className="group rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5 shadow-xl shadow-black/10 transition-all hover:-translate-y-1 hover:border-[#6D5DFB]/60 hover:shadow-[#6D5DFB]/10"
                >
                  <div className="flex h-36 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-[#151B2E] text-3xl font-black text-white">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc(product.imageUrl)} alt={product.productName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      product.category.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-wide text-[#19C37D]">{product.category}</p>
                    <h3 className="mt-1 min-h-[48px] text-base font-black leading-6 text-white">{product.productName}</h3>
                    <p className="mt-3 text-2xl font-black text-white">{Math.round(product.price)} TND</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{eligibilityText(product)}</p>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <a
                      href={product.sourceUrl || storeItem.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#151B2E] px-3 py-3 text-center text-sm font-black text-slate-200 transition-colors hover:bg-[#6D5DFB] hover:text-white"
                    >
                      Voir produit
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openProductInApp(product)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#6D5DFB] px-3 py-3 text-center text-sm font-black text-white shadow-lg shadow-[#6D5DFB]/15 transition-colors hover:bg-[#7C6DFF]"
                    >
                      Ouvrir app
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {articles.length === 0 && (
              <div className="rounded-[24px] border border-[#26324A] bg-[#111827] p-10 text-center">
                <ShoppingBag className="mx-auto h-10 w-10 text-slate-500" />
                <h3 className="mt-4 text-xl font-black text-white">Aucun article publie</h3>
                <p className="mt-2 text-sm text-slate-400">Les articles ajoutes par l&apos;admin apparaitront ici automatiquement.</p>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-[#26324A] bg-[#111827]/90 p-5">
              <h3 className="text-lg font-black text-white">Informations</h3>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Site web', value: domain(storeItem.websiteUrl), icon: Globe2 },
                  { label: 'Localisation', value: storeItem.country, icon: MapPin },
                  { label: 'Mis a jour', value: storeItem.updatedAt ? new Date(storeItem.updatedAt).toLocaleDateString('fr-TN') : 'Catalogue live', icon: Clock },
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

      <MobileAccessModal
        isOpen={mobileModal.open}
        onClose={() => setMobileModal((state) => ({ ...state, open: false }))}
        deepLink={mobileModal.link}
        title={mobileModal.name}
      />
    </div>
  );
}
