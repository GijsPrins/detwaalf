<script setup lang="ts">
definePageMeta({ auth: false, layout: "landing" });

const { t } = useI18n();
const user = useSupabaseUser();
useHead(() => ({ title: t("page.home") }));
</script>

<template>
  <div class="flex-1 relative flex flex-col bg-gray-50">
    <section class="flex-1 relative overflow-hidden pt-3 sm:pt-6 lg:pt-12">
      <div
        class="max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-14 lg:py-24 grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-12"
      >
        <!-- Hero text -->
        <div class="relative z-10 text-center lg:text-left animate-fade-in-up">
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
              v-if="!user"
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
          <div class="lg:hidden mt-8 flex justify-center">
            <ProvinceLandingMap class="w-40 sm:w-52 h-auto" />
          </div>
        </div>

        <div
          class="hidden lg:flex items-center justify-center animate-pulse-subtle"
        >
          <ProvinceLandingMap class="w-80 xl:w-96 h-auto" />
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
  0%,
  100% {
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
.delay-100 {
  animation-delay: 150ms;
}
.delay-200 {
  animation-delay: 300ms;
}
.delay-300 {
  animation-delay: 450ms;
}
</style>
