import { mobileDownloadConfig } from '@/config/mobileDownloadConfig';
import { detectMobileOS, MobileOS } from '@/lib/mobile-os';
import {
  buildExpoGoUrl,
  buildLandingUrl,
  getMobileRedirectTarget,
  isValidHttpUrl,
  isValidMobileLink,
} from '@/lib/mobile-redirect';

export { detectMobileOS };
export type { MobileOS };
export { getMobileRedirectTarget, isValidHttpUrl, isValidMobileLink };

export const MOBILE_DOWNLOAD_CONFIG = {
  ...mobileDownloadConfig,
  landingPath: '/mobile-download',
  defaultQrCodeUrl: mobileDownloadConfig.downloadLandingUrl,
  qrCodeUrl: mobileDownloadConfig.downloadLandingUrl,
  appStoreUrl: mobileDownloadConfig.iosAppStoreUrl,
  googlePlayUrl: mobileDownloadConfig.androidPlayStoreUrl,
  expoDevBuildUrl: '',
} as const;

export const EXPO_LINKING_PREFIXES = [
  mobileDownloadConfig.deepLinkScheme,
  mobileDownloadConfig.expoGoUrl,
].filter(Boolean);

interface LandingUrlOptions {
  deepLink?: string;
  source?: string;
}

export function getMobileDownloadLandingUrl(origin: string, options: LandingUrlOptions = {}) {
  return buildLandingUrl(origin, options);
}

export function getMobileWebUrl(origin: string) {
  if (mobileDownloadConfig.mobileWebUrl) return mobileDownloadConfig.mobileWebUrl;

  try {
    const url = new URL(origin || mobileDownloadConfig.downloadLandingUrl);
    url.port = '8083';
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

export function getAutomaticDownloadTarget(os: MobileOS, deepLink?: string) {
  return getMobileRedirectTarget(os, deepLink)?.url ?? '';
}

export function getExpoGoUrl(deepLink?: string) {
  return buildExpoGoUrl(mobileDownloadConfig.expoGoUrl, deepLink);
}
