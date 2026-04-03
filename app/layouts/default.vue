<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const supabase = useSupabaseClient()

const otherLocale = computed(() => locale.value === 'nl' ? 'EN' : 'NL')

function toggleLocale() {
  setLocale(locale.value === 'nl' ? 'en' : 'nl')
}

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <nav class="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <NuxtLink to="/dashboard" class="text-sm font-semibold text-gray-900">
        {{ t('nav.brand') }}
      </NuxtLink>
      <div class="flex items-center gap-6">
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
        <button
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          @click="logout"
        >
          {{ t('nav.logout') }}
        </button>
        <button
          class="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          @click="toggleLocale"
        >
          {{ otherLocale }}
        </button>
      </div>
    </nav>
    <main class="flex-1 max-w-6xl mx-auto w-full px-8 py-8">
      <slot />
    </main>
  </div>
</template>
