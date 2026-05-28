export type MobileOS = 'android' | 'ios' | 'desktop' | 'unknown';

export function detectMobileOS(userAgent: string, platform = '', maxTouchPoints = 0): MobileOS {
  if (/android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/i.test(userAgent)) return 'ios';
  if (/Macintosh/i.test(userAgent) && /Mac/i.test(platform) && maxTouchPoints > 1) return 'ios';
  if (/Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) return 'unknown';
  return 'desktop';
}

export function detectCurrentMobileOS(): MobileOS {
  if (typeof navigator === 'undefined') return 'desktop';

  return detectMobileOS(
    navigator.userAgent,
    navigator.platform,
    navigator.maxTouchPoints,
  );
}
