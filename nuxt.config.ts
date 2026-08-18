import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-04-02",
  devtools: { enabled: process.env.NODE_ENV !== "production" },
  runtimeConfig: {
    brevoApiKey: process.env.BREVO_API_KEY || "",
    contactNotificationFrom:
      process.env.CONTACT_NOTIFICATION_FROM ||
      "notificaties@mail.twaalfprovincies.run",
    contactNotificationTo:
      process.env.CONTACT_NOTIFICATION_TO || "info@twaalfprovincies.run",
  },
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
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0",
        },
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
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 60, // 60 days — keeps session alive across new tabs and restarts
      sameSite: "lax",
    },
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/update-password",
        "/confirm",
        "/events",
        "/events/*",
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
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        // Start with 5-minute max-age; increase to 1 year once verified stable in prod
        "Strict-Transport-Security": "max-age=300; includeSubDomains",
      },
    },
  },
});
