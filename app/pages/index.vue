<script setup lang="ts">
definePageMeta({ auth: false, layout: "landing" });

const { t } = useI18n();
useHead(() => ({ title: t("page.home") }));
</script>

<template>
  <div class="flex-1 relative flex flex-col bg-gray-50">
    <section class="flex-1 relative flex items-center overflow-hidden pt-12">
      <!-- Map anchored to the right, full section height -->
      <div
        class="hidden lg:flex absolute right-0 top-0 h-full w-1/2 items-center justify-end pr-12 animate-pulse-subtle"
      >
        <ProvinceLandingMap class="h-3/4 w-auto" />
      </div>

      <!-- Hero text -->
      <div
        class="relative z-10 w-full lg:w-1/2 px-8 py-24 text-center lg:text-left animate-fade-in-up"
      >
        <h1 class="text-4xl font-bold text-gray-900 tracking-tight mb-4">
          {{ t("landing.hero.tagline") }}
        </h1>
        <p
          class="text-base text-gray-500 mb-10 max-w-sm leading-relaxed mx-auto lg:mx-0"
        >
          {{ t("landing.hero.description") }}
        </p>
        <div class="flex items-center justify-center lg:justify-start gap-4">
          <NuxtLink
            to="/login"
            class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            {{ t("landing.hero.cta") }}
          </NuxtLink>
          <NuxtLink
            to="/onboarding"
            class="inline-flex items-center rounded-lg bg-white border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {{ t("landing.hero.onboarding") }}
          </NuxtLink>
        </div>

        <!-- Map shown inline on mobile -->
        <div class="lg:hidden mt-12 flex justify-center">
          <ProvinceLandingMap class="w-40 sm:w-52 h-auto" />
        </div>
      </div>
    </section>

    <section class="px-8 pb-24">
      <div class="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div class="animate-fade-in-up delay-100">
          <h3 class="text-sm font-semibold text-gray-900 mb-2">
            {{ t("landing.features.provinces.title") }}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            {{ t("landing.features.provinces.description") }}
          </p>
        </div>
        <div class="animate-fade-in-up delay-200">
          <h3 class="text-sm font-semibold text-gray-900 mb-2">
            {{ t("landing.features.medals.title") }}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            {{ t("landing.features.medals.description") }}
          </p>
        </div>
        <div class="animate-fade-in-up delay-300">
          <h3 class="text-sm font-semibold text-gray-900 mb-2">
            {{ t("landing.features.progress.title") }}
          </h3>
          <p class="text-sm text-gray-500 leading-relaxed">
            {{ t("landing.features.progress.description") }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes pulseSubtle {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.03);
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-pulse-subtle {
  animation: pulseSubtle 5s ease-in-out infinite;
}
.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.delay-100 { animation-delay: 150ms; }
.delay-200 { animation-delay: 300ms; }
.delay-300 { animation-delay: 450ms; }
</style>
