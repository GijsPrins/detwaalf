import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-04-02",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      titleTemplate: "%s · Twaalf Provincies",
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@svg-maps/netherlands"],
    },
  },
  modules: ["@nuxtjs/supabase", "@nuxtjs/i18n", "@pinia/nuxt"],
  supabase: {
    types: "~/types/database.types.ts",
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: [
        "/",
        "/login",
        "/register",
        "/confirm",
        "/events",
        "/onboarding",
        "/privacy",
        "/profile/*",
      ],
      saveRedirectToCookie: true,
    },
  },
  i18n: {
    defaultLocale: "nl",
    locales: [{ code: "nl", language: "nl-NL", file: "nl.ts" }],
    langDir: "locales/",
  },
});
