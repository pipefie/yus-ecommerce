export default {
  locales: ['en', 'es', 'fr', 'de'],
  defaultLocale: 'en',
  // Load translations from single JSON files like locales/en.json
  loadLocaleFrom: (lang, ns) =>
    import(`./locales/${lang}.json`).then((m) => m.default),
  pages: {
    '*': ['common'],
  },
};