<script setup lang="ts">
definePageMeta({ auth: false, layout: "landing" });

const { t } = useI18n();
useHead(() => ({ title: t("page.onboarding") }));
</script>

<template>
  <div class="flex-1 bg-white flex flex-col">
    <!-- Main Content -->
    <div class="flex-1 max-w-3xl mx-auto w-full px-6 py-8 lg:py-24">
      <!-- Header -->
      <div class="mb-16 animate-fade-in-up delay-100">
        <h1
          class="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-4"
        >
          {{ t("onboarding.title") }}
        </h1>
        <p class="text-lg text-gray-500 leading-relaxed max-w-xl">
          {{ t("onboarding.subtitle") }}
        </p>
      </div>

      <!-- Steps wrapper with a visual timeline line on desktop -->
      <div class="relative space-y-12 lg:space-y-16">
        <!-- Vertical Line (Desktop only) -->
        <div
          class="hidden lg:block absolute left-6 top-8 bottom-8 w-px bg-gray-100"
        ></div>

        <!-- Step 1 -->
        <div class="relative lg:pl-20 animate-fade-in-up delay-200">
          <div
            class="hidden lg:flex absolute left-0 top-1 w-12 h-12 bg-gray-50 border border-gray-100 rounded-full items-center justify-center text-gray-400"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {{ t("onboarding.step1.title") }}
          </h3>
          <p class="text-base text-gray-500 leading-relaxed">
            {{ t("onboarding.step1.desc") }}
          </p>
        </div>

        <!-- Step 2 -->
        <div class="relative lg:pl-20 animate-fade-in-up delay-300">
          <div
            class="hidden lg:flex absolute left-0 top-1 w-12 h-12 bg-gray-50 border border-gray-100 rounded-full items-center justify-center text-gray-400"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            {{ t("onboarding.step2.title") }}
          </h3>
          <p class="text-base text-gray-500 leading-relaxed mb-6">
            {{ t("onboarding.step2.desc") }}
          </p>

          <!-- Medals Layout -->
          <div class="grid grid-cols-3 gap-2 sm:gap-4">
            <div
              class="group relative bg-white border border-gray-100 rounded-xl p-3 sm:p-5 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <span
                class="inline-flex items-center text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-full mb-2 sm:mb-3 text-orange-700 bg-orange-100"
                style="background-color: #fcece3; color: #cd7f32"
              >
                {{ t("onboarding.medals.bronze") }}
              </span>
              <p class="text-xs sm:text-sm text-gray-500 leading-snug">
                {{ t("onboarding.medals.bronzeDesc") }}
              </p>
            </div>

            <div
              class="group relative bg-white border border-gray-100 rounded-xl p-3 sm:p-5 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <span
                class="inline-flex items-center text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-full mb-2 sm:mb-3 text-gray-700 bg-gray-200"
                style="background-color: #f3f4f6; color: #6b7280"
              >
                {{ t("onboarding.medals.silver") }}
              </span>
              <p class="text-xs sm:text-sm text-gray-500 leading-snug">
                {{ t("onboarding.medals.silverDesc") }}
              </p>
            </div>

            <div
              class="group relative bg-white border border-gray-100 rounded-xl p-3 sm:p-5 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <span
                class="inline-flex items-center text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-full mb-2 sm:mb-3 text-yellow-700 bg-yellow-100"
                style="background-color: #fef9c3; color: #a16207"
              >
                {{ t("onboarding.medals.gold") }}
              </span>
              <p class="text-xs sm:text-sm text-gray-500 leading-snug">
                {{ t("onboarding.medals.goldDesc") }}
              </p>
            </div>
          </div>
        </div>

        <!-- Step 3 -->
        <div class="relative lg:pl-20 animate-fade-in-up delay-400">
          <div
            class="hidden lg:flex absolute left-0 top-1 w-12 h-12 bg-gray-50 border border-gray-100 rounded-full items-center justify-center text-gray-400"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {{ t("onboarding.step3.title") }}
          </h3>
          <p class="text-base text-gray-500 leading-relaxed">
            {{ t("onboarding.step3.desc") }}
          </p>
        </div>
      </div>

      <!-- CTA -->
      <div class="mt-20 lg:pl-20 animate-fade-in-up delay-500">
        <NuxtLink
          to="/register"
          class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-8 py-3.5 text-base font-medium text-white hover:bg-orange-700 transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
        >
          {{ t("onboarding.cta") }}
          <svg
            class="ml-2 w-4 h-4"
            transform="translate(0, 1)"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            ></path>
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-100 {
  animation-delay: 100ms;
}
.delay-200 {
  animation-delay: 200ms;
}
.delay-300 {
  animation-delay: 350ms;
}
.delay-400 {
  animation-delay: 500ms;
}
.delay-500 {
  animation-delay: 650ms;
}
</style>
