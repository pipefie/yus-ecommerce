declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function sendGAEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('cookieConsent') !== 'true') return;
  const gtag = window.gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', event, params);
}