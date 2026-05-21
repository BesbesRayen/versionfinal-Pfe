'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Clock, Eye, Search, ShieldCheck, XCircle } from 'lucide-react';
import {
  getAdminKycDocuments,
  approveKyc,
  rejectKyc,
  fetchAdminKycEvidence,
  AdminKycDocument as KycDocument,
} from '@/lib/api';

const statusStyles: Record<string, string> = {
  VERIFIED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-300 border-red-500/20',
  PENDING_MANUAL_REVIEW: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  PROVIDER_FAILED: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  PENDING: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

const statusLabels: Record<string, string> = {
  VERIFIED: 'Vérifié',
  REJECTED: 'Rejeté',
  PENDING_MANUAL_REVIEW: 'Revue manuelle',
  PROVIDER_FAILED: 'Provider échoué',
  PENDING: 'En attente',
};

const evidenceLabels = [
  ['cinFrontUrl', 'CIN recto'],
  ['cinBackUrl', 'CIN verso'],
  ['selfieUrl', 'Selfie'],
] as const;

export default function KycPage() {
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      setDocuments(await getAdminKycDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les vérifications KYC.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocuments(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchesStatus = status === 'ALL' || doc.status === status;
      const matchesSearch = !q || [
        doc.userFirstName,
        doc.userLastName,
        doc.userEmail,
        doc.cinNumber,
        doc.extractedIdentityNumber,
        doc.providerReason,
      ].some((value) => value?.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [documents, search, status]);

  const openEvidence = async (url?: string) => {
    if (!url) return;
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(await fetchAdminKycEvidence(url));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le document.');
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    setError('');
    try {
      await approveKyc(id, 'Manual review approved by admin');
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approbation impossible.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId || !comment.trim()) return;
    setActionLoading(rejectId);
    setError('');
    try {
      await rejectKyc(rejectId, comment.trim());
      setDocuments((prev) => prev.filter((doc) => doc.id !== rejectId));
      setRejectId(null);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejet impossible.');
    } finally {
      setActionLoading(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revue KYC</h1>
          <p className="text-gray-500 mt-1">{documents.length} dossier(s) à traiter manuellement</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, CIN, email..."
              className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-[#0a0f1c] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2.5 bg-[#0a0f1c] border border-white/10 rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING_MANUAL_REVIEW">Revue manuelle</option>
            <option value="PROVIDER_FAILED">Provider échoué</option>
            <option value="PENDING">En attente</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric label="Revues manuelles" value={documents.filter((d) => d.status === 'PENDING_MANUAL_REVIEW').length} icon={<Clock />} />
        <Metric label="Provider échoué" value={documents.filter((d) => d.status === 'PROVIDER_FAILED').length} icon={<AlertTriangle />} />
        <Metric label="Risque élevé" value={documents.filter((d) => (d.fraudRiskScore ?? 0) >= 80).length} icon={<ShieldCheck />} />
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center h-40 items-center">
          <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Aucun dossier ne correspond au filtre</p>
          <p className="text-gray-500 text-sm mt-1">Les nouvelles revues manuelles apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((doc) => (
            <div key={doc.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5">
              <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles[doc.status] ?? statusStyles.PENDING}`}>
                      {statusLabels[doc.status] ?? doc.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleString('fr-FR') : 'Date inconnue'}
                    </span>
                  </div>
                  <h2 className="text-white font-semibold">
                    {doc.userFirstName || 'Utilisateur'} {doc.userLastName || `#${doc.userId}`}
                  </h2>
                  <p className="text-sm text-gray-500">{doc.userEmail || 'Email indisponible'} · {doc.userPhone || 'Téléphone indisponible'}</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <Info label="CIN saisie" value={doc.cinNumber || 'Non saisie'} />
                    <Info label="CIN extraite" value={doc.extractedIdentityNumber || 'Non extraite'} />
                    <Info label="Confiance" value={doc.providerConfidence != null ? `${Math.round(normalizeScore(doc.providerConfidence) * 100)}%` : 'N/A'} />
                    <Info label="Risque fraude" value={doc.fraudRiskScore != null ? `${doc.fraudRiskScore}/100` : 'N/A'} />
                  </div>
                  {(doc.providerReason || doc.fraudSignals) && (
                    <div className="mt-4 rounded-xl bg-[#0a0f1c] border border-white/5 p-3">
                      <p className="text-xs font-semibold text-gray-400 mb-1">Indicateurs</p>
                      <p className="text-sm text-gray-300">{doc.providerReason || 'Aucune réponse provider.'}</p>
                      {doc.fraudSignals && <p className="text-xs text-orange-300 mt-2">{doc.fraudSignals}</p>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 xl:w-[360px]">
                  <div className="grid grid-cols-3 gap-2">
                    {evidenceLabels.map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => openEvidence(doc[key])}
                        disabled={!doc[key]}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 bg-[#0a0f1c] border border-white/10 rounded-lg text-xs text-gray-300 hover:border-indigo-400/50 disabled:opacity-40"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(doc.id)}
                      disabled={actionLoading === doc.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => setRejectId(doc.id)}
                      disabled={actionLoading === doc.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Rejeter le dossier #{rejectId}</h3>
            <p className="text-sm text-gray-500 mb-4">Le motif sera enregistré dans l’audit et visible dans l’historique KYC.</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Motif du rejet..."
              rows={4}
              className="w-full px-4 py-3 bg-[#0a0f1c] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!comment.trim() || actionLoading === rejectId} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                Confirmer
              </button>
              <button onClick={() => { setRejectId(null); setComment(''); }} className="flex-1 py-2.5 bg-[#0a0f1c] border border-white/10 text-gray-300 rounded-xl text-sm font-semibold">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={closePreview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Document KYC" className="max-w-full max-h-[84vh] object-contain rounded-xl border border-white/10" />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-300 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0a0f1c] border border-white/5 p-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{label}</p>
      <p className="text-sm text-gray-200 mt-1 truncate">{value}</p>
    </div>
  );
}

function normalizeScore(value: number) {
  return value > 1 ? value / 100 : value;
}
