'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  AdminArticle,
  AdminArticleInput,
  ProductImportResult,
  PublicStore,
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  getAdminStores,
  importProductFromUrl,
  updateAdminArticle,
  updateAdminArticleStatus,
  uploadArticleImage,
  BACKEND,
} from '@/lib/api';

const emptyForm: AdminArticleInput = {
  productName: '',
  description: '',
  price: 0,
  imageUrl: '',
  boutiqueName: '',
  category: '',
  sourceUrl: '',
  active: true,
  available: true,
  eligibleThreeMonths: true,
  eligibleSixMonths: true,
  eligibleTwelveMonths: true,
};

type StorePrefillRequest = {
  storeId?: string | null;
  storeSlug?: string | null;
  store?: string | null;
  boutique?: string | null;
  category?: string | null;
  manual: boolean;
  fromStores: boolean;
};

function imageSrc(src: string) {
  if (!src) return '';
  return src.startsWith('/') ? `${BACKEND}${src}` : src;
}

function normalizeLookup(value?: string | null) {
  let decoded = value || '';
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    decoded = value || '';
  }
  return decoded
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function findStoreForPrefill(stores: PublicStore[], request: StorePrefillRequest | null) {
  if (!request) return null;
  const numericStoreId = request.storeId ? Number(request.storeId) : NaN;
  if (Number.isFinite(numericStoreId)) {
    const byId = stores.find((store) => store.id === numericStoreId);
    if (byId) return byId;
  }

  const candidates = [request.storeSlug, request.store, request.boutique].map(normalizeLookup).filter(Boolean);
  return stores.find((store) => {
    const storeName = normalizeLookup(store.name);
    const storeSlug = normalizeLookup(store.slug);
    return candidates.some((candidate) => candidate === storeSlug || candidate === storeName);
  }) || null;
}

function normalizeHost(value?: string | null) {
  if (!value) return '';
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}

function findStoreForImport(stores: PublicStore[], result: ProductImportResult | null, rawUrl: string) {
  const sourceHost = normalizeHost(result?.sourceUrl || rawUrl);
  const importedDomain = normalizeHost(result?.store?.domain);
  const importedNames = [result?.store?.name, result?.brand].map(normalizeLookup).filter(Boolean);

  return stores.find((store) => {
    const storeHost = normalizeHost(store.websiteUrl);
    const storeName = normalizeLookup(store.name);
    const hostMatches = Boolean(
      sourceHost && (storeHost === sourceHost || sourceHost.endsWith(`.${storeHost}`) || storeHost.endsWith(`.${sourceHost}`)),
    );
    const importedDomainMatches = Boolean(
      importedDomain && (storeHost === importedDomain || importedDomain.endsWith(`.${storeHost}`) || storeHost.endsWith(`.${importedDomain}`)),
    );
    const nameMatches = importedNames.some((name) => name === storeName);
    return hostMatches || importedDomainMatches || nameMatches;
  }) || null;
}

function parseImportedPrice(value?: string) {
  const normalized = (value || '').replace(/\s+/g, '').replace(',', '.');
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return 0;
  const price = Number(match[0]);
  if (!Number.isFinite(price) || price <= 0) return 0;
  return Number(price.toFixed(3));
}

function cleanImportedText(value?: string) {
  const text = (value || '').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower.includes('comment_text') || /[{][!=%#]/.test(text)) return '';
  return text;
}

function displayImportedPrice(value?: string) {
  const price = parseImportedPrice(value);
  return price > 0 ? String(price) : value;
}

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [stores, setStores] = useState<PublicStore[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<AdminArticle | null>(null);
  const [form, setForm] = useState<AdminArticleInput>(emptyForm);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [manualMode, setManualMode] = useState(false);
  const [returnToStores, setReturnToStores] = useState(false);
  const [storePrefill, setStorePrefill] = useState<StorePrefillRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Supprimer ${selectedIds.size} article(s) sélectionné(s) ?`)) return;
    setDeleting(true);
    setError('');
    const failed: number[] = [];
    for (const id of selectedIds) {
      try {
        await deleteAdminArticle(id);
      } catch {
        failed.push(id);
      }
    }
    setSelectedIds(new Set());
    await loadArticles();
    setDeleting(false);
    if (failed.length > 0) {
      setError(`${failed.length} article(s) n'ont pas pu être supprimés (commandes liées).`);
    }
  };

  // URL import state
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importWarning, setImportWarning] = useState('');
  const [importedPreview, setImportedPreview] = useState<ProductImportResult | null>(null);

  const loadArticles = async () => {
    try {
      const data = await getAdminArticles({
        search: search || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        storeId: storeFilter === 'all' ? undefined : Number(storeFilter),
        active: statusFilter === 'all' ? undefined : statusFilter === 'published',
      });
      setArticles(data);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArticles();
    void getAdminStores().then(setStores).catch(() => setStores([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      void loadArticles();
    }, 250);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, storeFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get('search');
    const boutique = params.get('boutique');
    const category = params.get('category');
    const storeId = params.get('storeId');
    const storeSlug = params.get('storeSlug');
    const store = params.get('store');
    const manual = params.get('manual') === '1';
    const fromStores = params.get('from') === 'stores';
    const request: StorePrefillRequest = {
      storeId,
      storeSlug,
      store,
      boutique,
      category,
      manual,
      fromStores,
    };

    if (initialSearch) {
      setSearch(initialSearch);
    }

    if (storeId || storeSlug || store || boutique) {
      const numericStoreId = storeId ? Number(storeId) : undefined;
      if (storeId && Number.isFinite(numericStoreId)) {
        setStoreFilter(storeId);
      }
      if (category) setCategoryFilter(category);
      setStorePrefill(request);
      setManualMode(manual);
      setReturnToStores(fromStores);
      setEditing(null);
      setForm({
        ...emptyForm,
        storeId: Number.isFinite(numericStoreId) ? numericStoreId : undefined,
        boutiqueName: store || boutique || '',
        category: category || '',
      });
      setImagePreview('');
      setImportUrl('');
      setImportError('');
      setImportWarning('');
      setImportedPreview(null);
      setOpenModal(true);
    }
  }, []);

  useEffect(() => {
    if (!storePrefill || stores.length === 0) return;
    const selected = findStoreForPrefill(stores, storePrefill);
    if (!selected) return;
    setStoreFilter(String(selected.id));
    setForm((prev) => ({
      ...prev,
      boutiqueName: selected.name,
      category: prev.category || storePrefill.category || selected.category,
      storeId: selected.id,
    }));
  }, [storePrefill, stores]);

  useEffect(() => {
    if (!form.storeId || stores.length === 0) return;
    const selected = stores.find((store) => store.id === form.storeId);
    if (!selected) return;
    setForm((prev) => {
      if (prev.boutiqueName === selected.name && (prev.category || selected.category) === prev.category) {
        return prev;
      }
      return {
        ...prev,
        boutiqueName: selected.name,
        category: prev.category || selected.category,
      };
    });
  }, [form.storeId, stores]);

  const categories = useMemo(() => Array.from(new Set(articles.map((article) => article.category).filter(Boolean))).sort(), [articles]);
  const filtered = articles;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selectedStore = form.storeId ? stores.find((store) => store.id === form.storeId) : null;
  const prefilledStoreLabel = form.boutiqueName || storePrefill?.store || storePrefill?.boutique || '';
  const selectedStoreAntiRobotLevel = selectedStore?.antiRobotLevel || (selectedStore?.hasAntiRobot ? 'soft' : 'none');
  const isHardAntiRobotStore = selectedStoreAntiRobotLevel === 'hard';

  const isAllSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));
  const isIndeterminate = !isAllSelected && filtered.some((a) => selectedIds.has(a.id));

  const clearArticleUrl = () => {
    if (typeof window !== 'undefined' && window.location.search) {
      router.replace('/admin/articles', { scroll: false });
    }
  };

  const handleStoreChange = (value: string) => {
    if (value === '__prefill__') return;
    if (!value) {
      setForm((prev) => ({ ...prev, storeId: undefined, boutiqueName: '' }));
      return;
    }
    const storeId = Number(value);
    const selected = stores.find((store) => store.id === storeId);
    if (!selected) {
      setError('Boutique introuvable dans le registry.');
      return;
    }
    setError('');
    setForm((prev) => ({
      ...prev,
      storeId: selected.id,
      boutiqueName: selected.name,
      category: prev.category || selected.category || '',
    }));
  };

  const resetModal = () => {
    setOpenModal(false);
    setEditing(null);
    setForm(emptyForm);
    setManualMode(false);
    setReturnToStores(false);
    setStorePrefill(null);
    setImagePreview('');
    setImportUrl('');
    setImportError('');
    setImportWarning('');
    setImportedPreview(null);
    clearArticleUrl();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setManualMode(false);
    setReturnToStores(false);
    setStorePrefill(null);
    setImagePreview('');
    setImportUrl('');
    setImportError('');
    setImportWarning('');
    setImportedPreview(null);
    clearArticleUrl();
    setOpenModal(true);
  };

  const openEdit = (article: AdminArticle) => {
    setEditing(article);
    setForm({
      productName: article.productName,
      description: article.description,
      price: article.price,
      imageUrl: article.imageUrl,
      boutiqueName: article.boutiqueName,
      storeId: article.storeId,
      category: article.category,
      sourceUrl: article.sourceUrl ?? '',
      active: article.active,
      available: article.available ?? true,
      eligibleThreeMonths: article.eligibleThreeMonths ?? true,
      eligibleSixMonths: article.eligibleSixMonths ?? true,
      eligibleTwelveMonths: article.eligibleTwelveMonths ?? true,
    });
    const preview = article.imageUrl?.startsWith('/')
      ? `${BACKEND}${article.imageUrl}`
      : article.imageUrl;
    setImagePreview(preview || '');
    setImportUrl('');
    setImportError('');
    setImportedPreview(null);
    setManualMode(false);
    setReturnToStores(false);
    setStorePrefill(null);
    setOpenModal(true);
  };
  // ── URL Import ────────────────────────────────────────────────────────────

  // Client-side URL slug extraction for graceful fallback when scraping fails
  function extractFromUrlClientSide(raw: string): { name: string; brand: string } {
    try {
      const url = new URL(raw);
      const hostname = url.hostname.replace(/^www\./, '');
      const domainBrand: Record<string, string> = {
        'decathlon.tn': 'Decathlon', 'decathlon.fr': 'Decathlon',
        'zara.com': 'Zara', 'mytek.tn': 'MyTek', 'megapc.tn': 'Mega PC',
        'tunisianet.com.tn': 'Tunisianet', 'jumia.com.tn': 'Jumia',
        'lacasashops.com': 'La Casa', 'fatales.tn': 'Fatales',
        'mobileplanet.tn': 'Mobile Planet',
      };
      const brand = domainBrand[hostname] ?? hostname.split('.')[0].replace(/-/g, ' ');
      const segments = url.pathname.split('/').filter(Boolean);
      let slug = segments[segments.length - 1] ?? '';
      slug = slug.replace(/\.[a-z]{2,5}$/, '');
      slug = slug.replace(/^\d+-\d+-/, '').replace(/^[\d-]+-/, '');
      // Remove query-string noise (IDs at end like -112778-)
      slug = slug.replace(/-\d{4,}-?.*$/, '');
      const name = slug.split('-').filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ').slice(0, 120);
      return { name, brand };
    } catch {
      return { name: '', brand: '' };
    }
  }

  const handleImportUrl = async () => {
    setImportError('');
    setImportedPreview(null);

    if (!importUrl.trim()) {
      setImportError("Entrez une URL de produit.");
      return;
    }
    if (!/^https?:\/\/.+/.test(importUrl.trim())) {
      setImportError("URL invalide. Elle doit commencer par http:// ou https://");
      return;
    }

    setImportWarning('');
    setImporting(true);
    try {
      const result = await importProductFromUrl(importUrl.trim());

      if (!result.valid) {
        // Graceful fallback: extract what we can from the URL itself
        const fallback = extractFromUrlClientSide(importUrl.trim());
        const resolvedStore = findStoreForImport(stores, null, importUrl.trim());
        setForm((prev) => ({
          ...prev,
          productName: fallback.name || prev.productName,
          storeId: prev.storeId || resolvedStore?.id,
          boutiqueName: prev.storeId ? prev.boutiqueName : resolvedStore?.name || fallback.brand || prev.boutiqueName,
          category: prev.category || resolvedStore?.category || '',
          sourceUrl: importUrl.trim(),
        }));
        setImportWarning(
          (result.errorMessage ? result.errorMessage + ' ' : '') +
          'Formulaire pré-rempli depuis l\'URL — vérifiez et complétez manuellement.'
        );
        setImportedPreview(null);
        return;
      }

      // Partial data (e.g. site returned 403 but slug was decoded)
      if (result.errorMessage) setImportWarning(result.errorMessage);

      setImportedPreview(result);

      // Auto-fill the form
      const priceNum = parseImportedPrice(result.price);
      const importedDescription = cleanImportedText(result.description);
      const resolvedStore = findStoreForImport(stores, result, importUrl.trim());
      const fallbackDescription = result.name
        ? `${result.name} importe depuis ${resolvedStore?.name || result.brand || 'la boutique source'}.`
        : '';
      setForm((prev) => ({
        ...prev,
        productName: result.name || prev.productName,
        description: importedDescription || prev.description || fallbackDescription,
        price: priceNum > 0 ? priceNum : prev.price,
        imageUrl: result.images?.[0] ?? prev.imageUrl,
        storeId: prev.storeId || resolvedStore?.id,
        boutiqueName: prev.storeId ? prev.boutiqueName : resolvedStore?.name || result.brand || prev.boutiqueName,
        category: result.category || prev.category || resolvedStore?.category || '',
        sourceUrl: result.sourceUrl || importUrl.trim(),
      }));

      const firstImage = result.images?.[0];
      if (firstImage) setImagePreview(firstImage);

    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'import.";
      if (msg.toLowerCase().includes('deja importe') || msg.toLowerCase().includes('already imported')) {
        setImportError('Ce produit est deja importe.');
      } else {
        setImportError(msg);
      }
    } finally {
      setImporting(false);
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const imageUrl = await uploadArticleImage(file);
      setForm((prev) => ({ ...prev, imageUrl }));
      const previewUrl = `${BACKEND}${imageUrl}`;
      setImagePreview(previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSave = async () => {
    const selectedFormStore = form.storeId
      ? stores.find((store) => store.id === form.storeId) || {
        id: form.storeId,
        name: form.boutiqueName || prefilledStoreLabel,
        category: form.category,
      }
      : stores.find((store) => normalizeLookup(store.name) === normalizeLookup(form.boutiqueName)) || null;

    if (!selectedFormStore || !selectedFormStore.name) {
      setError('Selectionnez une boutique. Les articles doivent etre lies a une boutique registry.');
      return;
    }

    if (!form.productName.trim() || !form.description.trim() || !form.imageUrl.trim() || !form.category.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (form.price <= 0) {
      setError('Le prix doit etre superieur a zero.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload: AdminArticleInput = {
        ...form,
        storeId: selectedFormStore.id,
        boutiqueName: selectedFormStore.name,
        category: form.category || selectedFormStore.category,
      };

      if (editing) {
        await updateAdminArticle(editing.id, payload);
      } else {
        await createAdminArticle(payload);
      }
      const wasEditing = !!editing;
      resetModal();
      setLoading(true);
      await loadArticles();
      setSuccessMsg(wasEditing ? 'Article mis à jour avec succès.' : 'Article créé avec succès.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to save article';
      if (msg.toLowerCase().includes('deja importe') || msg.toLowerCase().includes('already imported')) {
        setError('Ce produit est deja importe.');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const onDelete = async (article: AdminArticle) => {
    if (!confirm(`Supprimer l'article "${article.productName}" ?`)) return;
    setDeletingId(article.id);
    setError('');
    setSuccessMsg('');
    try {
      await deleteAdminArticle(article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
      setSuccessMsg('Article supprime avec succes.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete article');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (article: AdminArticle) => {
    setStatusLoadingId(article.id);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await updateAdminArticleStatus(article.id, !article.active);
      setArticles((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      setSuccessMsg(updated.active ? 'Article publie.' : 'Article passe en brouillon.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de modifier le statut.');
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Floating selection bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-[#1e2535] border border-white/10 shadow-2xl shadow-black/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {selectedIds.size}
            </div>
            <span className="text-sm text-gray-300 font-medium">
              article{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Désélectionner
          </button>
          <button
            onClick={onDeleteSelected}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-red-900/40"
          >
            {deleting ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Suppression...</>
            ) : (
              <><Trash2 className="w-4 h-4" />Supprimer {selectedIds.size > 1 ? `les ${selectedIds.size}` : 'l\'article'}</>
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Articles Partenaires</h1>
          <p className="text-gray-500 mt-1">
            {articles.length} article{articles.length !== 1 ? 's' : ''} dans le catalogue
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#111827] p-3 lg:grid-cols-[1fr_220px_180px_190px]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a0f1c] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500"
            placeholder="Rechercher par produit, boutique ou categorie"
          />
        </div>
        <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#0a0f1c] px-3 py-2.5 text-sm font-semibold text-white">
          <option value="all">Toutes les boutiques</option>
          {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#0a0f1c] px-3 py-2.5 text-sm font-semibold text-white">
          <option value="all">Toutes categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-white/10 bg-[#0a0f1c] px-3 py-2.5 text-sm font-semibold text-white">
          <option value="all">Tous statuts</option>
          <option value="published">Publie</option>
          <option value="draft">Brouillon</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </th>
                {['Image', 'Produit', 'Boutique', 'Categorie', 'Prix', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                    Chargement des articles...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                    Aucun article trouve
                  </td>
                </tr>
              ) : (
                paginated.map((article) => (
                  <tr key={article.id} className={`hover:bg-[#0a0f1c] transition-colors ${selectedIds.has(article.id) ? 'bg-indigo-500/5' : ''}`}>
                    <td className="px-5 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(article.id)}
                        onChange={() => toggleSelect(article.id)}
                        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc(article.imageUrl)}
                        alt={article.productName}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium">{article.productName}</p>
                      <p className="text-xs text-gray-500 mt-1 max-w-[280px] truncate">{article.description}</p>
                      {article.sourceUrl && (
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1"
                        >
                          <Link2 className="w-3 h-3" />
                          Source
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{article.boutiqueName}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-400">{article.category}</div>
                      <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${article.active ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300' : 'border-slate-400/20 bg-slate-500/10 text-slate-300'}`}>
                        {article.active ? 'Publie' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-emerald-400 font-semibold">{Math.round(article.price)} TND</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(article)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Modifier
                        </button>
                        <button
                          onClick={() => toggleStatus(article)}
                          disabled={statusLoadingId === article.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold disabled:opacity-60"
                        >
                          {statusLoadingId === article.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {article.active ? 'Brouillon' : 'Publier'}
                        </button>
                        <button
                          onClick={() => onDelete(article)}
                          disabled={deletingId === article.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold disabled:opacity-60"
                        >
                          {deletingId === article.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          {deletingId === article.id ? 'Suppression' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-gray-400">
          <span>Page {page} / {totalPages} - {filtered.length} article{filtered.length > 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-white/10 px-3 py-2 font-bold text-white disabled:opacity-40">Precedent</button>
            <button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-xl border border-white/10 px-3 py-2 font-bold text-white disabled:opacity-40">Suivant</button>
          </div>
        </div>
      )}

      {/* Modal */}
      {openModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center overflow-hidden bg-slate-950/80 px-3 py-3 backdrop-blur-sm sm:px-6 sm:py-6">
          <div className="my-auto grid h-[calc(100dvh-1.5rem)] max-h-[780px] min-h-0 w-full max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/70 sm:h-[min(85dvh,780px)]">

            <div className="border-b border-white/10 bg-[#111827]/95 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Catalogue partenaire
                  </div>
                  <h2 className="text-xl font-black text-white">
                    {editing ? 'Modifier article' : manualMode ? 'Ajouter article manuel' : 'Ajouter article'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {returnToStores ? 'Boutique preselectionnee depuis la page boutiques.' : 'Creez un vrai article rattache a une boutique registry.'}
                  </p>
                </div>
                <button onClick={resetModal} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Fermer le modal">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
              {manualMode && (
                <div className="rounded-2xl border border-orange-300/25 bg-orange-500/10 p-4 text-sm font-semibold text-orange-100">
                  {isHardAntiRobotStore ? 'Ajout manuel requis pour cette boutique anti-robot.' : 'Ajout manuel active.'} Aucun produit fake ne sera cree: renseignez un vrai article et sa boutique.
                </div>
              )}

            {/* ── Smart URL Import (new articles only) ── */}
            {!editing && !manualMode && (
              <div className="space-y-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.07] p-4 shadow-xl shadow-black/10">
                <div className="flex items-center gap-2 text-sm font-black text-indigo-200">
                  <Sparkles className="h-4 w-4" />
                  Import intelligent depuis une URL produit
                </div>
                <p className="text-xs leading-5 text-slate-400">
                  Collez l&apos;URL d&apos;un produit (Zara, Decathlon, MyTek, Mega PC…) pour remplir automatiquement le formulaire.
                </p>

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    value={importUrl}
                    onChange={(e) => { setImportUrl(e.target.value); setImportError(''); setImportWarning(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleImportUrl(); }}
                    placeholder="https://www.exemple.com/produit/..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
                  />
                  <button
                    type="button"
                    onClick={() => void handleImportUrl()}
                    disabled={importing}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-black text-white transition hover:bg-indigo-400 disabled:opacity-60"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyse...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Importer
                      </>
                    )}
                  </button>
                </div>

                {importError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {importError}
                  </div>
                )}

                {importWarning && !importError && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {importWarning}
                  </div>
                )}

                {importedPreview && importedPreview.valid && (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                    {importedPreview.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={importedPreview.images[0]}
                        alt={importedPreview.name}
                        className="h-16 w-16 shrink-0 rounded-lg border border-white/10 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <p className="truncate text-sm font-bold text-white">{importedPreview.name}</p>
                      </div>
                      {importedPreview.price && (
                        <p className="text-sm text-emerald-400 font-semibold mt-0.5">{displayImportedPrice(importedPreview.price)} TND</p>
                      )}
                      {importedPreview.brand && (
                        <p className="text-xs text-gray-400 mt-0.5">Marque: {importedPreview.brand}</p>
                      )}
                      {importedPreview.aiExtracted && (
                        <span className="inline-flex items-center gap-1 text-xs text-violet-300 mt-1">
                          <Sparkles className="w-3 h-3" />
                          Extrait par IA
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Nom du produit *</span>
                <input
                  value={form.productName}
                  onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
                  placeholder="Ex: Serum vitamine C"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Prix (TND) *</span>
                <input
                  value={form.price || ''}
                  type="number"
                  min="0"
                  step="0.01"
                  onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="0.00"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Boutique *</span>
                <select
                  value={form.storeId ? String(form.storeId) : prefilledStoreLabel ? '__prefill__' : ''}
                  onChange={(e) => handleStoreChange(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 text-sm font-semibold text-white outline-none transition focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
                >
                  <option value="">Selectionner une boutique</option>
                  {prefilledStoreLabel && !stores.some((store) => store.id === form.storeId || store.name === prefilledStoreLabel) && (
                    <option value={form.storeId ? String(form.storeId) : '__prefill__'}>
                      {prefilledStoreLabel}
                    </option>
                  )}
                  {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Categorie *</span>
                <input
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="Categorie"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['active', 'Article actif'],
                ['available', 'Disponible'],
                ['eligibleThreeMonths', 'Eligible 3 mois'],
                ['eligibleSixMonths', 'Eligible 6 mois'],
                ['eligibleTwelveMonths', 'Eligible 12 mois'],
              ].map(([field, label]) => (
                <label key={field} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0a0f1c] px-3 py-2.5 text-sm font-semibold text-gray-200">
                  {label}
                  <input
                    type="checkbox"
                    checked={Boolean(form[field as keyof AdminArticleInput])}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.checked }))}
                    className="h-4 w-4 accent-indigo-500"
                  />
                </label>
              ))}
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Image produit *</span>
              <input
                value={form.imageUrl}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, imageUrl: e.target.value }));
                  setImagePreview(e.target.value);
                }}
                placeholder="URL de l'image ou fichier charge"
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Lien source produit</span>
              <input
                value={form.sourceUrl || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder="https://..."
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0f1c] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
              />
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0a0f1c] p-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 transition hover:border-indigo-400/40 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Chargement...' : 'Charger une image'}
              </button>
              {imagePreview ? (
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-white/10">
                  <ImageIcon className="h-5 w-5 text-slate-600" />
                </div>
              )}
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Description *</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description visible dans le catalogue"
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#0a0f1c] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10"
              />
            </label>

            {form.sourceUrl && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link2 className="w-3 h-3" />
                <span className="truncate">Source: {form.sourceUrl}</span>
              </div>
            )}

            </div>

            <div className="shrink-0 border-t border-white/10 bg-[#111827]/95 p-4">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={resetModal}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-[#0a0f1c] px-5 text-sm font-bold text-slate-300 transition hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-black text-white transition hover:bg-indigo-400 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Enregistrement...' : editing ? 'Mettre a jour' : "Creer l'article"}
              </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
