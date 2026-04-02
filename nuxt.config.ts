// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-04-02',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
  ],
  supabase: {
    types: '~/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm'],
      saveRedirectToCookie: true,
    },
  },
  i18n: {
    defaultLocale: 'nl',
    locales: [
      { code: 'nl', language: 'nl-NL', file: 'nl.ts' },
      { code: 'en', language: 'en-US', file: 'en.ts' },
    ],
    langDir: 'locales/',
  },
})
