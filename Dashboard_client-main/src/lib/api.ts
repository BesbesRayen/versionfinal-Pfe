/**
 * Admin API client. All calls proxy through Next.js /api/backend/**
 * which forwards to the Spring Boot backend at http://localhost:8082
 */

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api/backend';

export const BACKEND = BACKEND_BASE;

const backendUrl = (path: string) => {
  if (BACKEND_BASE === '/api/backend' && path.startsWith('/api/')) {
    return `${BACKEND_BASE}${path.slice('/api'.length)}`;
  }
  return `${BACKEND_BASE}${path}`;
};

const withQuery = (
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) => {
  if (!params) return path;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
};

export async function fetchBackend<T>(path: string, init?: RequestInit): Promise<T> {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const res = await fetch(backendUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'X-Admin-Token': adminToken } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface AdminStats {
  totalUsers: number;
  totalCredits: number;
  totalInstallments: number;
  totalStores: number;
  totalArticles: number;
  totalOrders: number;
  creditOrders: number;
  totalInvoices: number;
  unreadCreditNotifications: number;
  pendingKyc: number;
  approvedKyc: number;
  pendingCredits: number;
  approvedCredits: number;
  rejectedCredits: number;
}

export const getAdminStats = () => fetchBackend<AdminStats>('/api/admin/stats');

export interface DevResetResult {
  status: string;
  database: string;
  deletedTables: string[];
  resetIdentities: string[];
  deletedUploadFiles: number;
  rowsBeforeReset: Record<string, number>;
  rowsAfterReset: Record<string, number>;
}

export const resetDevTestData = (resetToken: string, clearUploads = true) =>
  fetchBackend<DevResetResult>(
    `/api/admin/dev-reset?confirm=RESET_DATABASE&clearUploads=${clearUploads}`,
    {
      method: 'POST',
      headers: { 'X-Reset-Token': resetToken },
    },
  );

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profession?: string;
  kycStatus: string;
  createdAt: string;
}

export const getAdminUsers = () => fetchBackend<AdminUser[]>('/api/admin/users');
export const deleteAdminUser = (userId: number) => fetchBackend<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, { method: 'DELETE' });

export interface AdminCredit {
  id: number;
  userId: number;
  productName: string;
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
  monthlyAmount: number;
  status: string;
  createdAt: string;
}

export const getAdminCredits = () => fetchBackend<AdminCredit[]>('/api/admin/credits');

export interface AdminInstallment {
  id: number;
  creditRequestId: number;
  userId: number;
  productName?: string;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string;
}

export const getAdminInstallments = () => fetchBackend<AdminInstallment[]>('/api/admin/installments');

export interface AdminKycDocument {
  id: number;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  userPhone?: string;
  cinFrontUrl?: string;
  cinBackUrl?: string;
  selfieUrl?: string;
  cinNumber: string;
  extractedFirstName?: string;
  extractedLastName?: string;
  extractedDateOfBirth?: string;
  extractedIdentityNumber?: string;
  diditIdentityId?: string;
  status: string;
  adminComment?: string;
  faceMatchScore?: number;
  livenessScore?: number;
  spoofDetected?: boolean;
  providerConfidence?: number;
  providerReason?: string;
  fraudSignals?: string;
  fraudRiskScore?: number;
  createdAt: string;
  auditLogs?: {
    id: number;
    adminId: string;
    previousStatus: string;
    decision: string;
    reason?: string;
    createdAt: string;
  }[];
}

export const getAdminKycDocuments = () => fetchBackend<AdminKycDocument[]>('/api/admin/kyc/pending');
export const getAdminKycReview = (documentId: number) =>
  fetchBackend<AdminKycDocument>(`/api/admin/kyc/${documentId}`);

export const approveKyc = (documentId: number, comment?: string) =>
  fetchBackend<AdminKycDocument>(
    `/api/admin/kyc/${documentId}/approve`,
    { method: 'POST', body: JSON.stringify({ reason: comment || 'Manual admin approval' }) },
  );

export const rejectKyc = (documentId: number, comment: string) =>
  fetchBackend<AdminKycDocument>(
    `/api/admin/kyc/${documentId}/reject`,
    { method: 'POST', body: JSON.stringify({ reason: comment }) },
  );

export const fetchAdminKycEvidence = async (path: string): Promise<string> => {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const res = await fetch(backendUrl(path), {
    headers: adminToken ? { 'X-Admin-Token': adminToken } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
};

export const approveCredit = (creditId: number) =>
  fetchBackend<AdminCredit>(`/api/admin/credits/${creditId}/approve`, { method: 'PUT' });

export const rejectCredit = (creditId: number) =>
  fetchBackend<AdminCredit>(`/api/admin/credits/${creditId}/reject`, { method: 'PUT' });

export interface AdminArticle {
  id: number;
  storeId?: number;
  productName: string;
  description: string;
  price: number;
  promoPrice?: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
  brand?: string;
  stockQuantity?: number;
  warranty?: string;
  availability?: string;
  active: boolean;
  available?: boolean;
  eligibleThreeMonths?: boolean;
  eligibleSixMonths?: boolean;
  eligibleTwelveMonths?: boolean;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminArticleInput {
  storeId?: number;
  productName: string;
  description: string;
  price: number;
  promoPrice?: number;
  imageUrl: string;
  boutiqueName: string;
  category: string;
  brand?: string;
  stockQuantity?: number;
  warranty?: string;
  availability?: string;
  sourceUrl?: string;
  active?: boolean;
  available?: boolean;
  eligibleThreeMonths?: boolean;
  eligibleSixMonths?: boolean;
  eligibleTwelveMonths?: boolean;
}

export type PublicArticle = AdminArticle;

export interface PublicStore {
  id: number;
  slug: string;
  name: string;
  category: string;
  country: string;
  websiteUrl: string;
  logoUrl: string;
  coverImageUrl?: string;
  parserType?: string;
  difficulty?: string;
  hasAntiRobot?: boolean;
  antiRobotLevel?: 'none' | 'soft' | 'hard' | string;
  visibleOnClient?: boolean;
  description?: string;
  articleCount: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreInput {
  name: string;
  slug?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl: string;
  category: string;
  country: string;
  parserType?: string;
  difficulty?: string;
  hasAntiRobot?: boolean;
  antiRobotLevel?: 'none' | 'soft' | 'hard' | string;
  visibleOnClient?: boolean;
  description?: string;
  active?: boolean;
}

export interface CreditPlan {
  months: number;
  label: string;
  feePercent: number;
  feeLabel: string;
  description: string;
  recommended: boolean;
}

export interface ProductImportResult {
  name: string;
  price: string;
  description: string;
  images: string[];
  brand: string;
  category: string;
  sourceUrl: string;
  aiExtracted: boolean;
  valid: boolean;
  errorMessage?: string;
  store?: {
    name?: string;
    domain?: string;
  };
}

export const getAdminArticles = (params?: { category?: string; boutiqueName?: string; search?: string; active?: boolean; storeId?: number }) =>
  fetchBackend<AdminArticle[]>(withQuery('/api/admin/articles', params));

export const getPublicArticles = (params?: { category?: string; boutiqueName?: string; search?: string }) =>
  fetchBackend<PublicArticle[]>(withQuery('/api/articles', params));

export const getPublicPopularArticles = (limit = 12) =>
  fetchBackend<PublicArticle[]>(withQuery('/api/articles/popular', { limit }));

export const getPublicStores = () =>
  fetchBackend<PublicStore[]>('/api/public/stores');

export const getPublicStore = (storeId: string) =>
  fetchBackend<PublicStore>(`/api/public/stores/${encodeURIComponent(storeId)}`);

export const getPublicStoreArticles = (storeId: string) =>
  fetchBackend<PublicArticle[]>(`/api/public/stores/${encodeURIComponent(storeId)}/articles`);

export const getAdminStores = () =>
  fetchBackend<PublicStore[]>('/api/admin/stores');

export const getAdminStore = (storeId: string | number) =>
  fetchBackend<PublicStore>(`/api/admin/stores/${encodeURIComponent(String(storeId))}`);

export const getAdminStoreArticles = (storeId: string | number) =>
  fetchBackend<AdminArticle[]>(`/api/admin/stores/${encodeURIComponent(String(storeId))}/articles`);

export const createAdminStore = (payload: StoreInput) =>
  fetchBackend<PublicStore>('/api/admin/stores', { method: 'POST', body: JSON.stringify(payload) });

export const updateAdminStore = (id: string | number, payload: StoreInput) =>
  fetchBackend<PublicStore>(`/api/admin/stores/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteAdminStore = (id: string | number) =>
  fetchBackend<{ success: boolean; message: string }>(`/api/admin/stores/${encodeURIComponent(String(id))}`, { method: 'DELETE' });

export const getCreditPlans = () => fetchBackend<CreditPlan[]>('/api/credit-plans');

export const uploadStoreImage = async (file: File): Promise<string> => {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(backendUrl('/api/admin/stores/upload-image'), {
    method: 'POST',
    body: formData,
    headers: adminToken ? { 'X-Admin-Token': adminToken } : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { imageUrl?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.imageUrl ?? '';
};

export const createAdminArticle = (payload: AdminArticleInput) =>
  fetchBackend<AdminArticle>('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateAdminArticle = (id: number, payload: AdminArticleInput) =>
  fetchBackend<AdminArticle>(`/api/admin/articles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const deleteAdminArticle = (id: number) =>
  fetchBackend<{ success: boolean; message: string }>(`/api/admin/articles/${id}`, {
    method: 'DELETE',
  });

export const updateAdminArticleStatus = (id: number, active: boolean) =>
  fetchBackend<AdminArticle>(`/api/admin/articles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });

export const uploadArticleImage = async (file: File): Promise<string> => {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(backendUrl('/api/admin/articles/upload-image'), {
    method: 'POST',
    body: formData,
    headers: adminToken ? { 'X-Admin-Token': adminToken } : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { imageUrl?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return data.imageUrl ?? '';
};

export const importProductFromUrl = async (url: string): Promise<ProductImportResult> => {
  // Call the Next.js server-side scraping route (no Spring Boot dependency)
  const res = await fetch('/api/scrape-product', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json() as ProductImportResult;
  return data;
};

export interface AdminInvoice {
  id: number;
  invoiceNumber: string;
  transactionId: string;
  orderId: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  articleName: string;
  boutiqueName: string;
  totalPrice: number;
  paymentType: string;
  numberOfInstallments: number;
  purchaseDate: string;
  status: string;
  statement: string;
  createdAt: string;
}

export const getAdminInvoices = () => fetchBackend<AdminInvoice[]>('/api/admin/invoices');

export const getAdminInvoice = (invoiceId: number) =>
  fetchBackend<AdminInvoice>(`/api/admin/invoices/${invoiceId}`);

export const downloadAdminInvoicePdf = async (invoiceId: number, invoiceNumber: string): Promise<void> => {
  const adminToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') ?? '') : '';
  const res = await fetch(backendUrl(`/api/admin/invoices/${invoiceId}/pdf`), {
    method: 'GET',
    headers: adminToken ? { 'X-Admin-Token': adminToken } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(text || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `facture-${invoiceNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export interface AdminCreditNotification {
  id: number;
  title: string;
  message: string;
  type: 'NEW_CREDIT_PURCHASE' | 'INVOICE_GENERATED';
  read: boolean;
  orderId?: number;
  transactionId?: string;
  createdAt: string;
}

export const getAdminNotifications = () =>
  fetchBackend<AdminCreditNotification[]>('/api/admin/notifications');

export const getAdminUnreadNotifications = () =>
  fetchBackend<AdminCreditNotification[]>('/api/admin/notifications/unread');

export const getAdminUnreadNotificationsCount = () =>
  fetchBackend<{ count: number }>('/api/admin/notifications/unread-count');

export const markAdminNotificationAsRead = (notificationId: number) =>
  fetchBackend<{ success: boolean; message: string }>(`/api/admin/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
