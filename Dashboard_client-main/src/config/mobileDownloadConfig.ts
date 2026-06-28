export type MobileDownloadMode = 'expo-go' | 'apk' | 'production';

const configuredMode = process.env.NEXT_PUBLIC_CREDITTN_MOBILE_MODE;
const legacyDownloadBaseUrl = process.env.NEXT_PUBLIC_CREDITTN_DOWNLOAD_BASE_URL;

const isMobileDownloadMode = (value: string | undefined): value is MobileDownloadMode =>
  value === 'expo-go' || value === 'apk' || value === 'production';

export const mobileDownloadConfig = {
  mode: isMobileDownloadMode(configuredMode) ? configuredMode : 'expo-go',

  expoGoUrl: process.env.NEXT_PUBLIC_CREDITTN_EXPO_GO_URL ?? '',
  expoGoAndroidInstallUrl:
    process.env.NEXT_PUBLIC_EXPO_GO_ANDROID_URL
    ?? 'https://play.google.com/store/apps/details?id=host.exp.exponent',
  expoGoIosInstallUrl:
    process.env.NEXT_PUBLIC_EXPO_GO_IOS_URL
    ?? 'https://apps.apple.com/app/expo-go/id982107779',
  androidApkUrl: process.env.NEXT_PUBLIC_CREDITTN_ANDROID_APK_URL ?? 'https://yourdomain.com/app/credittn.apk',
  androidPlayStoreUrl:
    process.env.NEXT_PUBLIC_CREDITTN_ANDROID_PLAY_STORE_URL
    ?? process.env.NEXT_PUBLIC_CREDITTN_GOOGLE_PLAY_URL
    ?? 'https://play.google.com/store/apps/details?id=com.credittn.app',
  iosAppStoreUrl:
    process.env.NEXT_PUBLIC_CREDITTN_IOS_APP_STORE_URL
    ?? process.env.NEXT_PUBLIC_CREDITTN_APP_STORE_URL
    ?? 'https://apps.apple.com/app/your-app-id',

  downloadLandingUrl:
    process.env.NEXT_PUBLIC_CREDITTN_DOWNLOAD_LANDING_URL
    ?? (legacyDownloadBaseUrl ? `${legacyDownloadBaseUrl.replace(/\/+$/, '')}/mobile-download` : undefined)
    ?? 'https://yourdomain.com/mobile-download',
  mobileWebUrl: process.env.NEXT_PUBLIC_CREDITTN_MOBILE_WEB_URL ?? '',

  deepLinkScheme: process.env.NEXT_PUBLIC_CREDITTN_DEEP_LINK_SCHEME ?? 'credittn://',
  defaultDeepLink: process.env.NEXT_PUBLIC_CREDITTN_DEFAULT_DEEP_LINK ?? 'credittn://home',
} as const;

export default mobileDownloadConfig;
