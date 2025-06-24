import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const lng = locale ?? 'en';              // ensure a valid locale
  return {
    locale: lng,
    messages: (await import(`../locales/${lng}.json`)).default
  };
});