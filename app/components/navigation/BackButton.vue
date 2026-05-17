<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    fallback?: string;
    hideOnHome?: boolean;
    variant?: "button" | "icon";
  }>(),
  {
    fallback: undefined,
    hideOnHome: true,
    variant: "icon",
  },
);

const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();

const fallbackPath = computed(() => props.fallback ?? (user.value ? "/dashboard" : "/"));
const isHidden = computed(() => props.hideOnHome && route.path === "/");

function goBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back();
    return;
  }

  navigateTo(fallbackPath.value);
}
</script>

<template>
  <button
    v-if="!isHidden"
    type="button"
    class="group inline-flex items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-50 hover:text-orange-700"
    :class="
      variant === 'button'
        ? 'gap-2 border border-gray-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:border-orange-200 hover:bg-orange-50'
        : 'h-9 w-9'
    "
    aria-label="Go back"
    title="Go back"
    @click="goBack"
  >
    <svg
      class="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.5 4.5 7 10l5.5 5.5"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span v-if="variant === 'button'">Back</span>
  </button>
</template>
