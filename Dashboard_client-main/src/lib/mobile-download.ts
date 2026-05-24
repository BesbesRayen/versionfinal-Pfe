export type MobileOS = 'android' | 'ios' | 'desktop' | 'unknown';

export const MOBILE_DOWNLOAD_CONFIG = {
  appName: 'CreditTN',
  landingPath: '/download-app',
  appStoreUrl: process.env.NEXT_PUBLIC_CREDITTN_APP_STORE_URL ?? 'https://apps.apple.com/app/credittn/id000000000',
  googlePlayUrl: process.env.NEXT_PUBLIC_CREDITTN_GOOGLE_PLAY_URL ?? 'https://play.google.com/store/apps/details?id=tn.credittn.app',
  androidApkUrl: process.env.NEXT_PUBLIC_CREDITTN_ANDROID_APK_URL ?? 'https://yourdomain.com/app/credittn.apk',
  expoGoUrl: process.env.NEXT_PUBLIC_CREDITTN_EXPO_GO_URL ?? '',
  expoDevBuildUrl: process.env.NEXT_PUBLIC_CREDITTN_EXPO_DEV_BUILD_URL ?? '',
  deepLinkScheme: process.env.NEXT_PUBLIC_CREDITTN_DEEP_LINK_SCHEME ?? 'creditn://',
  downloadBaseUrl: process.env.NEXT_PUBLIC_CREDITTN_DOWNLOAD_BASE_URL ?? '',
} as const;

export const EXPO_LINKING_PREFIXES = [
  MOBILE_DOWNLOAD_CONFIG.deepLinkScheme,
  MOBILE_DOWNLOAD_CONFIG.expoGoUrl,
  MOBILE_DOWNLOAD_CONFIG.expoDevBuildUrl,
].filter(Boolean);

interface LandingUrlOptions {
  deepLink?: string;
  source?: string;
}

export function getMobileDownloadLandingUrl(origin: string, options: LandingUrlOptions = {}) {
  const baseUrl = MOBILE_DOWNLOAD_CONFIG.downloadBaseUrl || origin;
  const url = new URL(MOBILE_DOWNLOAD_CONFIG.landingPath, baseUrl);

  if (options.deepLink) {
    url.searchParams.set('deepLink', options.deepLink);
  }

  if (options.source) {
    url.searchParams.set('source', options.source);
  }

  return url.toString();
}

export function detectMobileOS(userAgent: string, platform = '', maxTouchPoints = 0): MobileOS {
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'ios';
  if (/Macintosh/i.test(userAgent) && /Mac/i.test(platform) && maxTouchPoints > 1) return 'ios';
  if (/Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) return 'unknown';
  return 'desktop';
}

export function getAutomaticDownloadTarget(os: MobileOS) {
  if (os === 'android') return MOBILE_DOWNLOAD_CONFIG.androidApkUrl;
  if (os === 'ios') return MOBILE_DOWNLOAD_CONFIG.appStoreUrl;
  return '';
}

export function getQrCodeImageUrl(targetUrl: string, size = 280) {
  const safeSize = Math.min(Math.max(size, 180), 420);
  const params = new URLSearchParams({
    size: `${safeSize}x${safeSize}`,
    margin: '16',
    format: 'svg',
    color: '0F172A',
    bgcolor: 'FFFFFF',
    data: targetUrl,
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
