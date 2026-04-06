<script setup lang="ts">
import { usePersonaStore, type Persona } from '~/stores/persona'

const { t } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const personaStore = usePersonaStore()
const isDev = import.meta.dev

const personas: { key: Persona; label: string }[] = [
  { key: 'avonturier', label: 'Avonturier' },
  { key: 'presteerder', label: 'Presteerder' },
  { key: 'genieter', label: 'Genieter' },
]

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <nav class="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
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
          <button
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            @click="logout"
          >
            {{ t('nav.logout') }}
          </button>
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
    <div
      v-if="isDev"
      class="bg-yellow-50 border-b border-yellow-200 px-8 py-1.5 flex items-center gap-3"
    >
      <span class="text-xs text-yellow-600 font-medium shrink-0">Persona</span>
      <div class="flex gap-1">
        <button
          v-for="p in personas"
          :key="p.key"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors"
          :class="personaStore.active === p.key
            ? 'bg-yellow-400 text-yellow-900'
            : 'text-yellow-700 hover:bg-yellow-100'"
          @click="personaStore.active === p.key ? personaStore.clear() : personaStore.set(p.key)"
        >
          {{ p.label }}
        </button>
      </div>
      <span v-if="personaStore.active" class="text-xs text-yellow-500 ml-1">
        — klik nogmaals om te wissen
      </span>
    </div>
    <main class="flex-1 max-w-6xl mx-auto w-full px-8 py-8">
      <slot />
    </main>
  </div>
</template>
