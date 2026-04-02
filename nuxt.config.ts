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
  },
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'en'],
  },
})
