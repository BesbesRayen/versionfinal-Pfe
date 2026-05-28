'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Loader2, Package, PackagePlus, Search, ShieldAlert, Store } from 'lucide-react';
import { AdminArticle, BACKEND, PublicStore, getAdminStore, getAdminStoreArticles } from '@/lib/api';

function imageSrc(src: string) {
  if (!src) return '';
  return src.startsWith('/') ? `${BACKEND}${src}` : src;
}

export default function AdminStoreDetailPage() {
  const params = useParams();
  const storeId = String(params.id ?? '');
  const [store, setStore] = useState<PublicStore | null>(null);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [foundStore, storeArticles] = await Promise.all([
          getAdminStore(storeId),
          getAdminStoreArticles(storeId),
        ]);
        setStore(foundStore);
        setArticles(storeArticles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger la boutique.');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [storeId]);

  const filteredArticles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter((article) =>
      [article.productName, article.category, article.description].join(' ').toLowerCase().includes(term),
    );
  }, [articles, search]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-200" />
        Chargement de la boutique...
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-red-200">
        {error || 'Boutique introuvable.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/stores"
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-slate-300 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux boutiques
      </Link>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(20,184,166,0.18),transparent_28rem),radial-gradient(circle_at_86%_12%,rgba(109,93,251,0.16),transparent_24rem)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc(store.logoUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cyan-200">
                  <Store className="h-6 w-6" />
                </div>
              )}
            </div>
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                <Store className="h-3.5 w-3.5" />
                Detail boutique
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{store.name}</h1>
              <a href={store.websiteUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
                {store.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <Link
            href={`/admin/articles?storeId=${store.id}&store=${encodeURIComponent(store.name)}&category=${encodeURIComponent(store.category)}&from=stores${store.antiRobotLevel === 'hard' ? '&manual=1' : ''}`}
            title={store.antiRobotLevel === 'hard' ? 'Produits non recuperables automatiquement, ajout manuel requis.' : undefined}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/30 transition hover:-translate-y-0.5"
          >
            <PackagePlus className="h-4 w-4" />
            {store.antiRobotLevel === 'hard' ? 'Ajout manuel requis' : 'Ajouter article'}
          </Link>
        </div>
      </section>

      {store.antiRobotLevel === 'hard' && (
        <div className="rounded-2xl border border-orange-300/25 bg-orange-500/10 p-4 text-sm font-semibold text-orange-100">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">Hard anti-robot: acces bloque</p>
              <p className="mt-1 text-orange-100/80">Produits non recuperables automatiquement. Ajout manuel requis; aucun produit fake ne sera affiche cote client.</p>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un article de cette boutique"
            className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
          />
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredArticles.map((article) => (
          <article key={article.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-300/30">
            <div className="relative h-44 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              {article.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc(article.imageUrl)} alt={article.productName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <Package className="h-8 w-8" />
                </div>
              )}
              <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black ${article.active ? 'bg-emerald-400/90 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>
                {article.active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{article.category}</p>
              <h2 className="mt-1 line-clamp-2 min-h-[48px] text-lg font-black text-white">{article.productName}</h2>
              <p className="mt-2 text-2xl font-black text-emerald-300">{Math.round(article.price)} TND</p>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{article.description}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/admin/articles?search=${encodeURIComponent(article.productName)}`}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  Modifier
                </Link>
                {article.sourceUrl && (
                  <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white"
                    aria-label="Ouvrir la source"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {filteredArticles.length === 0 && (
        <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-10 text-center text-slate-400">
          <Package className="mx-auto h-10 w-10 text-slate-600" />
          <h2 className="mt-4 text-xl font-black text-white">Aucun article pour cette boutique</h2>
          <p className="mt-2 text-sm">Ajoutez un premier article pour le rendre visible cote web et mobile.</p>
        </div>
      )}
    </div>
  );
}
