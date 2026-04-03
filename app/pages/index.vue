<script setup lang="ts">
definePageMeta({ auth: false, layout: 'landing' })

const { t } = useI18n()
useHead(() => ({ title: t('page.home') }))
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <nav class="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-900">{{ t('landing.hero.title') }}</span>
      <NuxtLink
        to="/login"
        class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        {{ t('landing.nav.login') }}
      </NuxtLink>
    </nav>

    <section class="flex-1 flex flex-col items-center justify-center text-center px-8 py-32">
      <h1 class="text-4xl font-bold text-gray-900 tracking-tight mb-4">
        {{ t('landing.hero.tagline') }}
      </h1>
      <p class="text-base text-gray-500 mb-10 max-w-sm leading-relaxed">
        {{ t('landing.hero.description') }}
      </p>
      <NuxtLink
        to="/login"
        class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        {{ t('landing.hero.cta') }}
      </NuxtLink>
    </section>

    <section class="px-8 pb-24">
      <div class="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <h3 class="text-sm font-semibold text-gray-900 mb-2">
            {{ t('landing.features.provinces.title') }}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            {{ t('landing.features.provinces.description') }}
          </p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900 mb-2">
            {{ t('landing.features.medals.title') }}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            {{ t('landing.features.medals.description') }}
          </p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900 mb-2">
            {{ t('landing.features.progress.title') }}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            {{ t('landing.features.progress.description') }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
