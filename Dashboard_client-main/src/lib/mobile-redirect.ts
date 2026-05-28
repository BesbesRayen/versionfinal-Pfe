import { mobileDownloadConfig, MobileDownloadMode } from '@/config/mobileDownloadConfig';
import { MobileOS } from '@/lib/mobile-os';

export interface MobileRedirectTarget {
  label: string;
  url: string;
  warning?: string;
}

export function isPlaceholderUrl(value: string) {
  return /YOUR_LOCAL_IP|yourdomain\.com|your-app-id/i.test(value);
}

export function isValidMobileLink(value: string) {
  if (!value || isPlaceholderUrl(value)) return false;

  try {
    const url = new URL(value);
    return ['http:', 'https:', 'exp:', 'credittn:', 'creditn:', 'creaditn:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function isValidHttpUrl(value: string) {
  if (!value || isPlaceholderUrl(value)) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function getExpoLanHost() {
  try {
    const url = new URL(mobileDownloadConfig.expoGoUrl);
    return url.hostname;
  } catch {
    return '';
  }
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function replaceLocalhostWithLan(value: string) {
  const lanHost = getExpoLanHost();
  if (!lanHost) return value;

  try {
    const url = new URL(value);
    if (isLocalHost(url.hostname)) {
      url.hostname = lanHost;
    }
    return url.toString();
  } catch {
    return value;
  }
}

export function buildLandingUrl(origin: string, options: { deepLink?: string; source?: string } = {}) {
  const configured = mobileDownloadConfig.downloadLandingUrl;
  const localOrigin = origin || 'http://localhost:3000';
  const originUrl = new URL(localOrigin);
  const inferredLanOrigin = isLocalHost(originUrl.hostname)
    ? replaceLocalhostWithLan(originUrl.toString())
    : originUrl.toString();
  const base = isValidHttpUrl(configured)
    ? replaceLocalhostWithLan(configured)
    : new URL('/mobile-download', inferredLanOrigin).toString();
  const url = new URL(base);

  if (options.deepLink) url.searchParams.set('deepLink', options.deepLink);
  if (options.source) url.searchParams.set('source', options.source);

  return url.toString();
}

function normalizeDeepLinkPath(deepLink?: string) {
  if (!deepLink) return '';

  try {
    const url = new URL(deepLink);
    const host = url.hostname ? `/${url.hostname}` : '';
    return `${host}${url.pathname}${url.search}${url.hash}` || '/home';
  } catch {
    const clean = deepLink.startsWith('/') ? deepLink : `/${deepLink}`;
    return clean;
  }
}

export function buildExpoGoUrl(expoGoUrl: string, deepLink?: string) {
  if (!isValidMobileLink(expoGoUrl)) return '';

  const routePath = normalizeDeepLinkPath(deepLink);
  if (!routePath) return expoGoUrl;

  const [base, hash = ''] = expoGoUrl.split('#');
  const cleanBase = base.replace(/\/+$/, '');
  const separator = cleanBase.includes('/--/') ? '' : '/--';

  return `${cleanBase}${separator}${routePath}${hash ? `#${hash}` : ''}`;
}

export function getMobileRedirectTarget(os: MobileOS, deepLink?: string): MobileRedirectTarget | null {
  const mode: MobileDownloadMode = mobileDownloadConfig.mode;

  if (mode === 'expo-go') {
    const url = buildExpoGoUrl(mobileDownloadConfig.expoGoUrl, deepLink);
    return url
      ? {
          label: 'Expo Go',
          url,
          warning: "Expo Go doit etre installe pour ouvrir ce projet. Si rien ne s'ouvre, installez Expo Go puis revenez sur cette page.",
        }
      : {
          label: 'Expo Go',
          url: '',
          warning: 'Le lien Expo Go est manquant. Configurez NEXT_PUBLIC_CREDITTN_EXPO_GO_URL.',
        };
  }

  if (mode === 'apk') {
    if (os === 'ios') {
      return {
        label: 'APK Android',
        url: '',
        warning: "Le fichier APK est Android uniquement. Sur iPhone, utilisez Expo Go pendant le developpement.",
      };
    }

    return isValidMobileLink(mobileDownloadConfig.androidApkUrl)
      ? { label: 'APK Android', url: mobileDownloadConfig.androidApkUrl }
      : {
          label: 'APK Android',
          url: '',
          warning: 'Le lien APK Android est manquant ou invalide.',
        };
  }

  if (os === 'android') {
    return isValidMobileLink(mobileDownloadConfig.androidPlayStoreUrl)
      ? { label: 'Google Play', url: mobileDownloadConfig.androidPlayStoreUrl }
      : { label: 'Google Play', url: '', warning: 'Le lien Google Play est manquant ou invalide.' };
  }

  if (os === 'ios') {
    return isValidMobileLink(mobileDownloadConfig.iosAppStoreUrl)
      ? { label: 'App Store', url: mobileDownloadConfig.iosAppStoreUrl }
      : { label: 'App Store', url: '', warning: 'Le lien App Store est manquant ou invalide.' };
  }

  return null;
}

export function redirectToMobileTarget(target: MobileRedirectTarget) {
  if (!target.url || !isValidMobileLink(target.url)) return false;
  window.location.assign(target.url);
  return true;
}
