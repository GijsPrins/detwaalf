<script setup lang="ts">
const { t } = useI18n()
const user = useSupabaseUser()
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <nav class="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between">
      <NuxtLink
        :to="user ? '/dashboard' : '/'"
        class="text-sm font-semibold text-gray-900"
      >
        {{ t('nav.brand') }}
      </NuxtLink>
      <div class="flex items-center gap-6">
        <template v-if="user">
          <NuxtLink
            to="/dashboard"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t('nav.overview') }}
          </NuxtLink>
          <NuxtLink
            to="/events"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t('nav.events') }}
          </NuxtLink>
          <UserMenu />
        </template>
        <template v-else>
          <NuxtLink
            to="/events"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t('nav.events') }}
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t('nav.login') }}
          </NuxtLink>
        </template>
      </div>
    </nav>
    <main class="flex-1 max-w-6xl mx-auto w-full px-8 py-8">
      <slot />
    </main>
  </div>
</template>
