'use client';

import { FormEvent, RefObject, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  Bot,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Gauge,
  ImageIcon,
  Loader2,
  Package,
  PackagePlus,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  Upload,
  X,
} from 'lucide-react';
import {
  BACKEND,
  PublicStore,
  StoreInput,
  createAdminStore,
  getAdminStores,
  updateAdminStore,
  uploadStoreImage,
} from '@/lib/api';
import { compatibleStores } from '@/lib/product-import/compatible-stores';

const parserTypes = ['JsonLdParser', 'OpenGraphParser', 'MetaTagsParser', 'MagentoParser', 'PrestashopParser', 'WooCommerceParser', 'ShopifyParser', 'DynamicSiteParser', 'ApiParser'];
const difficulties = ['easy', 'medium', 'hard', 'very-hard'];
const hardAntiRobotDomains = ['jumia.com.tn', 'decathlon.tn', 'dabchy.com', 'zara.com'];
const softAntiRobotDomains = ['founa.com', 'lcwaikiki.com', 'ebay.com'];

const defaultForm: StoreInput = {
  name: '',
  websiteUrl: '',
  country: 'Tunisie',
  category: 'Marketplace',
  parserType: 'JsonLdParser',
  difficulty: 'medium',
  hasAntiRobot: false,
  antiRobotLevel: 'none',
  visibleOnClient: false,
  description: '',
  logoUrl: '',
  coverImageUrl: '',
  active: true,
};

function imageSrc(src?: string) {
  if (!src) return '';
  return src.startsWith('/') ? `${BACKEND}${src}` : src;
}

function websiteDomain(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function normalizeDomain(url: string) {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}

function normalizeStoreName(value?: string | null) {
  return (value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function findDuplicateStore(stores: PublicStore[], form: StoreInput, editingId?: number) {
  const name = normalizeStoreName(form.name);
  const domain = form.websiteUrl ? normalizeDomain(form.websiteUrl) : '';
  return stores.find((store) => {
    if (editingId && store.id === editingId) return false;
    const sameName = name && normalizeStoreName(store.name) === name;
    const sameDomain = domain && normalizeDomain(store.websiteUrl) === domain;
    return sameName || sameDomain;
  });
}

function prettifyName(domain: string) {
  return domain.split('.')[0].replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferStoreFromUrl(rawUrl: string): StoreInput {
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const domain = normalizeDomain(url);
  const known = compatibleStores.find((store) => domain === store.domain || domain.endsWith(`.${store.domain}`));
  const antiRobotLevel = hardAntiRobotDomains.some((item) => domain === item || domain.endsWith(`.${item}`))
    ? 'hard'
    : softAntiRobotDomains.some((item) => domain === item || domain.endsWith(`.${item}`)) || known?.antiBot
      ? 'soft'
      : 'none';
  const category = known?.category || (domain.includes('sport') || domain.includes('decathlon') ? 'Sport' : domain.includes('beaut') || domain.includes('para') || domain.includes('fatales') ? 'Beauty' : 'Marketplace');
  return {
    name: known?.name || prettifyName(domain),
    websiteUrl: url,
    logoUrl: known?.logoUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    coverImageUrl: '',
    country: known?.country || (domain.endsWith('.tn') || domain.includes('.tn') ? 'Tunisie' : 'International'),
    category,
    parserType: known?.parserType || (domain.includes('shopify') ? 'ShopifyParser' : domain.includes('woocommerce') ? 'WooCommerceParser' : 'OpenGraphParser'),
    difficulty: known?.difficulty || (antiRobotLevel === 'hard' ? 'hard' : 'medium'),
    antiRobotLevel,
    hasAntiRobot: antiRobotLevel !== 'none',
    visibleOnClient: false,
    description: known
      ? `${known.name} detectee automatiquement depuis ${domain}. ${antiRobotLevel === 'hard' ? 'Acces bloque: ajout manuel requis.' : 'Configuration pre-remplie pour le registry CreditTN.'}`
      : `Boutique detectee automatiquement depuis ${domain}. Verifiez les informations avant publication.`,
    active: true,
  };
}

function formFromStore(store: PublicStore): StoreInput {
  return {
    name: store.name,
    slug: store.slug,
    logoUrl: store.logoUrl || '',
    coverImageUrl: store.coverImageUrl || '',
    websiteUrl: store.websiteUrl,
    country: store.country,
    category: store.category,
    parserType: store.parserType || 'JsonLdParser',
    difficulty: store.difficulty || 'medium',
    hasAntiRobot: Boolean(store.hasAntiRobot),
    antiRobotLevel: store.antiRobotLevel || (store.hasAntiRobot ? 'soft' : 'none'),
    visibleOnClient: Boolean(store.visibleOnClient),
    description: store.description || '',
    active: store.active,
  };
}

export default function CompatibleStoresPage() {
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logoUrl' | 'coverImageUrl' | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [country, setCountry] = useState('all');
  const [antiRobot, setAntiRobot] = useState('all');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingStore, setEditingStore] = useState<PublicStore | null>(null);
  const [form, setForm] = useState<StoreInput>(defaultForm);
  const [error, setError] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadStores();
  }, []);

  const categories = useMemo(() => Array.from(new Set(stores.map((item) => item.category))).sort(), [stores]);
  const countries = useMemo(() => Array.from(new Set(stores.map((item) => item.country))).sort(), [stores]);
  const totalArticles = stores.reduce((sum, item) => sum + item.articleCount, 0);
  const antiRobotLevelOf = (item: PublicStore) => item.antiRobotLevel || (item.hasAntiRobot ? 'soft' : 'none');
  const antiRobotCount = stores.filter((item) => antiRobotLevelOf(item) !== 'none').length;

  const filteredStores = useMemo(() => {
    const query = search.toLowerCase().trim();
    return stores.filter((item) => {
      const matchesSearch = !query || `${item.name} ${item.websiteUrl} ${item.category} ${item.parserType ?? ''}`.toLowerCase().includes(query);
      const matchesCategory = category === 'all' || item.category === category;
      const matchesCountry = country === 'all' || item.country === country;
      const matchesAntiRobot =
        antiRobot === 'all' ||
        antiRobotLevelOf(item) === antiRobot;
      return matchesSearch && matchesCategory && matchesCountry && matchesAntiRobot;
    });
  }, [stores, search, category, country, antiRobot]);

  async function loadStores() {
    setLoading(true);
    setError('');
    try {
      setStores(await getAdminStores());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les boutiques.');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setModalMode('create');
    setEditingStore(null);
    setForm(defaultForm);
    setError('');
  }

  function openEdit(store: PublicStore) {
    setModalMode('edit');
    setEditingStore(store);
    setForm(formFromStore(store));
    setError('');
  }

  async function saveStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const duplicate = findDuplicateStore(stores, form, editingStore?.id);
    if (duplicate) {
      setError(`Cette boutique existe deja dans le registry: ${duplicate.name}.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingStore) {
        await updateAdminStore(editingStore.id, form);
      } else {
        await createAdminStore(form);
      }
      setModalMode(null);
      setEditingStore(null);
      setForm(defaultForm);
      await loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File | undefined, field: 'logoUrl' | 'coverImageUrl') {
    if (!file) return;
    setUploadingField(field);
    setError('');
    try {
      const imageUrl = await uploadStoreImage(file);
      setForm((prev) => ({ ...prev, [field]: imageUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible.');
    } finally {
      setUploadingField(null);
      if (field === 'logoUrl' && logoInputRef.current) logoInputRef.current.value = '';
      if (field === 'coverImageUrl' && coverInputRef.current) coverInputRef.current.value = '';
    }
  }

  function analyzeStoreUrl() {
    if (!form.websiteUrl.trim()) {
      setError('Collez d abord le lien de la boutique.');
      return;
    }
    const inferred = inferStoreFromUrl(form.websiteUrl);
    const duplicate = findDuplicateStore(stores, inferred, editingStore?.id);
    if (duplicate) {
      setForm((prev) => ({ ...prev, websiteUrl: inferred.websiteUrl }));
      setError(`Cette boutique existe deja dans le registry: ${duplicate.name}. Ouvrez sa ligne pour la modifier.`);
      return;
    }
    setForm((prev) => ({ ...prev, ...inferred }));
    setError('');
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111f] p-6 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),transparent_42%),radial-gradient(circle_at_82%_0%,rgba(109,93,251,0.24),transparent_26rem)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
              <Store className="h-3.5 w-3.5" />
              Catalogue connecte
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Boutiques compatibles
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Gere les logos, couvertures, sources API/scraping et articles visibles cote web et mobile.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/30 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Ajouter boutique
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total boutiques', value: stores.length, icon: Store, tone: 'text-cyan-200 bg-cyan-400/10 border-cyan-300/20' },
          { label: 'Anti-robot oui', value: antiRobotCount, icon: ShieldAlert, tone: 'text-amber-200 bg-amber-400/10 border-amber-300/20' },
          { label: 'Anti-robot non', value: stores.length - antiRobotCount, icon: CheckCircle2, tone: 'text-emerald-200 bg-emerald-400/10 border-emerald-300/20' },
          { label: 'Articles total', value: totalArticles, icon: Package, tone: 'text-violet-200 bg-violet-400/10 border-violet-300/20' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border ${stat.tone}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">{stat.label}</p>
          </div>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20 backdrop-blur-xl">
        <div className="grid gap-3 xl:grid-cols-[1fr_190px_180px_180px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher boutique, lien, parser ou categorie"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
            />
          </label>
          <Select value={category} onChange={setCategory} options={['all', ...categories]} labels={{ all: 'Toutes categories' }} />
          <Select value={country} onChange={setCountry} options={['all', ...countries]} labels={{ all: 'Tous pays' }} />
          <Select value={antiRobot} onChange={setAntiRobot} options={['all', 'none', 'soft', 'hard']} labels={{ all: 'Anti-robot toutes', none: 'Anti-robot Non', soft: 'Anti-robot Soft', hard: 'Anti-robot Hard' }} />
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/70 shadow-2xl shadow-black/25">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="w-[27%] px-4 py-4">Boutique</th>
                <th className="w-[11%] px-4 py-4">Categorie</th>
                <th className="w-[10%] px-4 py-4">Pays</th>
                <th className="w-[15%] px-4 py-4">Parser</th>
                <th className="w-[10%] px-4 py-4">Difficulte</th>
                <th className="w-[11%] px-4 py-4">Anti-robot</th>
                <th className="w-[10%] px-4 py-4">Articles</th>
                <th className="sticky right-0 z-10 w-[150px] bg-[#101726] px-4 py-4 text-right shadow-[-18px_0_24px_rgba(2,6,23,0.55)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-cyan-200" />
                    Chargement des boutiques...
                  </td>
                </tr>
              )}
              {!loading && filteredStores.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Aucune boutique trouvee.
                  </td>
                </tr>
              )}
              {!loading && filteredStores.map((storeItem) => (
                <tr key={storeItem.id} className="group transition hover:bg-white/[0.03]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                        {storeItem.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageSrc(storeItem.logoUrl)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-cyan-200">
                            <Store className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <button onClick={() => openEdit(storeItem)} className="block max-w-full truncate text-left font-bold text-white transition hover:text-cyan-200">
                          {storeItem.name}
                        </button>
                        <a href={storeItem.websiteUrl} target="_blank" className="mt-1 flex max-w-full items-center gap-1 truncate text-xs font-semibold text-cyan-200 hover:text-cyan-100">
                          <span className="truncate">{websiteDomain(storeItem.websiteUrl)}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{storeItem.category}</td>
                  <td className="px-4 py-4 text-sm text-slate-300">{storeItem.country}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1 text-xs font-bold text-violet-100">
                      <Gauge className="h-3.5 w-3.5" />
                      <span className="truncate">{storeItem.parserType || 'Manual'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-100">
                      {storeItem.difficulty || 'medium'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <AntiRobotBadge level={antiRobotLevelOf(storeItem)} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
                      {storeItem.articleCount}
                    </span>
                  </td>
                  <td className="sticky right-0 z-10 bg-[#070d1b] px-4 py-4 shadow-[-18px_0_24px_rgba(2,6,23,0.55)]">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/articles?storeId=${storeItem.id}&store=${encodeURIComponent(storeItem.name)}&from=stores${antiRobotLevelOf(storeItem) === 'hard' ? '&manual=1' : ''}`} title={antiRobotLevelOf(storeItem) === 'hard' ? 'Produits non recuperables automatiquement, ajout manuel requis.' : undefined} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-emerald-100 transition hover:bg-emerald-400/20">
                        <PackagePlus className="h-4 w-4" />
                        <span className="sr-only">{antiRobotLevelOf(storeItem) === 'hard' ? 'Ajout manuel requis' : 'Ajouter article'}</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modalMode && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-5">
          <div className="grid h-[calc(100dvh-1.5rem)] max-h-[820px] w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080d19] shadow-2xl shadow-black/60 sm:h-auto sm:max-h-[85vh]">
            <div className="border-b border-white/10 bg-[#0b1220]/95 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                  <Edit3 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-white">
                  {modalMode === 'create' ? 'Ajouter une boutique' : 'Modifier boutique'}
                </h2>
              </div>
              <button onClick={() => setModalMode(null)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:text-white">
                <X className="h-5 w-5" />
              </button>
              </div>
            </div>

            <form id="store-editor-form" onSubmit={(event) => void saveStore(event)} className="min-h-0 space-y-5 overflow-y-auto px-5 py-5">
              {error && (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                  {error}
                </div>
              )}
              {modalMode === 'create' && (
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black text-cyan-100">
                    <Sparkles className="h-4 w-4" />
                    Detection automatique boutique
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row">
                    <input
                      value={form.websiteUrl}
                      onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })}
                      placeholder="https://www.boutique.tn"
                      className="h-12 flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
                    />
                    <button type="button" onClick={analyzeStoreUrl} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                      Analyser URL
                    </button>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-cyan-100/70">
                    Remplit automatiquement nom, logo, image de couverture, parser, difficulte et anti-robot. Les boutiques hard restent en ajout manuel.
                  </p>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <TextField label="Nom boutique" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                {modalMode === 'edit' && <TextField label="Lien boutique" value={form.websiteUrl} onChange={(value) => setForm({ ...form, websiteUrl: value })} placeholder="https://example.tn" />}
                <TextField label="Categorie" value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
                <TextField label="Pays" value={form.country} onChange={(value) => setForm({ ...form, country: value })} />
                <SelectField label="Parser / Source" value={form.parserType || 'JsonLdParser'} values={parserTypes} onChange={(value) => setForm({ ...form, parserType: value })} />
                <SelectField label="Difficulte" value={form.difficulty || 'medium'} values={difficulties} onChange={(value) => setForm({ ...form, difficulty: value })} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <ImageUpload
                  label="Logo boutique"
                  value={form.logoUrl || ''}
                  uploading={uploadingField === 'logoUrl'}
                  inputRef={logoInputRef}
                  onUpload={(file) => void handleUpload(file, 'logoUrl')}
                  onChange={(value) => setForm({ ...form, logoUrl: value })}
                />
                <ImageUpload
                  label="Image couverture"
                  value={form.coverImageUrl || ''}
                  uploading={uploadingField === 'coverImageUrl'}
                  inputRef={coverInputRef}
                  onUpload={(file) => void handleUpload(file, 'coverImageUrl')}
                  onChange={(value) => setForm({ ...form, coverImageUrl: value })}
                />
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Description</span>
                <textarea
                  value={form.description || ''}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
                  placeholder="Description publique affichee sur la marketplace"
                />
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <SelectField label="Anti-robot" value={form.antiRobotLevel || 'none'} values={['none', 'soft', 'hard']} onChange={(value) => setForm({ ...form, antiRobotLevel: value, hasAntiRobot: value !== 'none' })} />
                <Toggle label="Visible cote client" checked={Boolean(form.visibleOnClient)} onChange={(checked) => setForm({ ...form, visibleOnClient: checked })} />
              </div>

            </form>
            <div className="flex flex-col gap-3 border-t border-white/10 bg-[#0b1220]/95 px-5 py-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModalMode(null)} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm font-black text-slate-200 transition hover:bg-white/[0.08]">
                Annuler
              </button>
              <button type="submit" form="store-editor-form" disabled={saving} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 shadow-xl shadow-cyan-950/30 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Enregistrement...' : 'Enregistrer boutique'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10" />
    </label>
  );
}

function Select({ value, onChange, options, labels }: { value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm font-semibold text-white outline-none focus:border-cyan-300/50">
      {options.map((item) => <option key={item} value={item}>{labels?.[item] || item}</option>)}
    </select>
  );
}

function SelectField({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/50">
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

function AntiRobotBadge({ level }: { level: string }) {
  const normalized = level || 'none';
  if (normalized === 'hard') {
    return (
      <span title="Produits non recuperables automatiquement, ajout manuel requis." className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-200">
        <ShieldAlert className="h-3.5 w-3.5" />
        Hard anti-robot
      </span>
    );
  }
  if (normalized === 'soft') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-black text-amber-200">
        <Bot className="h-3.5 w-3.5" />
        Soft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Non
    </span>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 text-sm font-semibold text-white">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
    </label>
  );
}

function ImageUpload({
  label,
  value,
  uploading,
  inputRef,
  onUpload,
  onChange,
}: {
  label: string;
  value: string;
  uploading: boolean;
  inputRef: RefObject<HTMLInputElement>;
  onUpload: (file?: File) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200">
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onUpload(event.target.files?.[0])} className="hidden" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="/api/files/stores/logo.png ou https://..." className="mb-3 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600" />
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.03]">
        {value && !value.includes('image.thum.io') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc(value)} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-7 w-7 text-slate-600" />
        )}
      </div>
    </div>
  );
}
