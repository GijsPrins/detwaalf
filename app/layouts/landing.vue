<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <!-- Shared Marketing Navbar -->
    <nav class="border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
      <NuxtLink to="/" class="text-sm font-semibold text-gray-900 transition-colors hover:text-orange-600">
        {{ t("nav.brand") }}
      </NuxtLink>
      <NuxtLink
        to="/login"
        class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        {{ t("landing.nav.login") }}
      </NuxtLink>
    </nav>
    <div class="flex-1 flex flex-col">
      <slot />
    </div>
  </div>
</template>
