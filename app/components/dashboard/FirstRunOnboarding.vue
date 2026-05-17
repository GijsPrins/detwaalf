<script setup lang="ts">
type StepState = "complete" | "active" | "locked";

const props = withDefaults(
  defineProps<{
    currentStep?: number;
    compact?: boolean;
    ctaTarget?: string;
    ctaLabel?: string;
  }>(),
  {
    currentStep: 2,
    compact: false,
    ctaTarget: "/events",
    ctaLabel: undefined,
  },
);

const { t } = useI18n();
const isCollapsed = ref(false);

const steps = computed(() => [
  {
    number: 1,
    title: t("dashboard.firstRun.steps.account.title"),
    description: t("dashboard.firstRun.steps.account.description"),
  },
  {
    number: 2,
    title: t("dashboard.firstRun.steps.explore.title"),
    description: t("dashboard.firstRun.steps.explore.description"),
    target: "/events",
  },
  {
    number: 3,
    title: t("dashboard.firstRun.steps.participation.title"),
    description: t("dashboard.firstRun.steps.participation.description"),
  },
  {
    number: 4,
    title: t("dashboard.firstRun.steps.distance.title"),
    description: t("dashboard.firstRun.steps.distance.description"),
    target: props.ctaTarget,
  },
  {
    number: 5,
    title: t("dashboard.firstRun.steps.complete.title"),
    description: t("dashboard.firstRun.steps.complete.description"),
    target: props.ctaTarget,
  },
]);

const currentStep = computed(() =>
  Math.max(1, Math.min(props.currentStep, steps.value.length)),
);

const currentStepInfo = computed(
  () => steps.value.find((step) => step.number === currentStep.value)!,
);

const resolvedCtaLabel = computed(
  () => props.ctaLabel ?? t("dashboard.firstRun.findEvent"),
);

function getStepState(stepNumber: number): StepState {
  if (stepNumber < currentStep.value) return "complete";
  if (stepNumber === currentStep.value) return "active";
  return "locked";
}

function getMarkerClass(state: StepState) {
  if (state === "complete") return "bg-green-100 text-green-700";
  if (state === "active") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-500";
}

function getRowClass(state: StepState) {
  if (state === "active") return "bg-orange-50 sm:bg-orange-50";
  if (state === "locked") return "opacity-65";
  return "";
}
</script>

<template>
  <section :class="compact ? 'mb-5' : 'space-y-6'">
    <div
      class="relative"
      :class="
        compact
          ? 'rounded-xl border border-gray-100 bg-white p-4 pr-12 sm:p-5 sm:pr-12'
          : 'sm:bg-white sm:border sm:border-gray-100 sm:rounded-xl sm:p-8'
      "
    >
      <button
        v-if="compact"
        type="button"
        class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
        :aria-label="
          isCollapsed
            ? t('dashboard.firstRun.expand')
            : t('dashboard.firstRun.collapse')
        "
        :title="
          isCollapsed
            ? t('dashboard.firstRun.expand')
            : t('dashboard.firstRun.collapse')
        "
        @click="isCollapsed = !isCollapsed"
      >
        <svg
          class="h-4 w-4 transition-transform"
          :class="{ 'rotate-180': isCollapsed }"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <div
        v-if="compact"
        class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase text-orange-600">
            {{ t("dashboard.firstRun.nextStep") }}
          </p>
          <h2 class="mt-1 text-lg font-bold text-gray-950">
            {{ currentStepInfo.title }}
          </h2>
          <p v-if="!isCollapsed" class="mt-1 text-sm leading-6 text-gray-600">
            {{ currentStepInfo.description }}
          </p>
        </div>
        <NuxtLink
          v-if="!isCollapsed"
          :to="ctaTarget"
          class="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          {{ resolvedCtaLabel }}
        </NuxtLink>
      </div>

      <div
        v-else
        class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="max-w-xl">
          <p class="mb-2 text-sm font-semibold text-orange-600">
            {{ t("dashboard.firstRun.eyebrow") }}
          </p>
          <h2 class="text-2xl font-black text-gray-950 sm:text-3xl">
            {{ t("dashboard.firstRun.title") }}
          </h2>
          <p class="mt-3 leading-7 text-gray-600">
            {{ t("dashboard.firstRun.description") }}
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <NuxtLink
            to="/events"
            class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            {{ t("dashboard.firstRun.findEvent") }}
          </NuxtLink>
          <NuxtLink
            to="/events?period=past"
            class="inline-flex items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-100"
          >
            {{ t("dashboard.firstRun.findPastEvent") }}
          </NuxtLink>
          <NuxtLink
            to="/onboarding"
            class="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {{ t("dashboard.firstRun.howItWorks") }}
          </NuxtLink>
        </div>
      </div>

      <div
        v-if="!compact || !isCollapsed"
        :class="
          compact
            ? 'mt-4 divide-y divide-gray-100 border-t border-gray-100'
            : 'mt-7 divide-y divide-gray-100 sm:mt-8 sm:rounded-lg sm:border sm:border-gray-100'
        "
      >
        <template v-for="step in steps" :key="step.number">
          <NuxtLink
            v-if="step.target && getStepState(step.number) !== 'locked'"
            :to="step.target"
            class="flex items-start gap-4 py-4 transition-colors hover:bg-orange-50 sm:p-4"
            :class="getRowClass(getStepState(step.number))"
          >
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="getMarkerClass(getStepState(step.number))"
            >
              <template v-if="getStepState(step.number) === 'complete'">
                &check;
              </template>
              <template v-else>{{ step.number }}</template>
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-950">
                {{ step.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ step.description }}
              </p>
            </div>
          </NuxtLink>

          <div
            v-else
            class="flex items-start gap-4 py-4 sm:p-4"
            :class="getRowClass(getStepState(step.number))"
          >
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="getMarkerClass(getStepState(step.number))"
            >
              <template v-if="getStepState(step.number) === 'complete'">
                &check;
              </template>
              <template v-else>{{ step.number }}</template>
            </div>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-950">
                {{ step.title }}
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ step.description }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
