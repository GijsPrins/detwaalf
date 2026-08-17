<script setup lang="ts">
definePageMeta({ layout: "auth" });

const { t } = useI18n();
useHead(() => ({ title: t("page.forgotPassword") }));

const supabase = useSupabaseClient();

const email = ref("");
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const canSubmit = computed(() => email.value.length > 0 && !loading.value);

async function requestPasswordReset() {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: `${window.location.origin}/update-password`,
  });

  if (error) {
    errorMessage.value = t("auth.forgotPassword.errors.generic");
  } else {
    successMessage.value = t("auth.forgotPassword.success");
    email.value = "";
  }

  loading.value = false;
}
</script>

<template>
  <div class="w-full max-w-sm px-6 py-8 bg-white rounded-xl border border-gray-100">
    <h1 class="text-2xl font-semibold text-gray-900 mb-2">
      {{ t("auth.forgotPassword.title") }}
    </h1>
    <p class="text-sm text-gray-500 mb-6">
      {{ t("auth.forgotPassword.subtitle") }}
    </p>

    <div
      v-if="successMessage"
      class="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm"
    >
      {{ successMessage }}
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="requestPasswordReset">
      <div class="flex flex-col gap-1.5">
        <label for="email" class="text-sm font-medium text-gray-700">
          {{ t("auth.forgotPassword.email") }}
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="mt-2 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{
          loading
            ? t("auth.forgotPassword.loading")
            : t("auth.forgotPassword.submit")
        }}
      </button>
    </form>

    <div class="mt-6 text-center">
      <NuxtLink
        to="/login"
        class="text-sm text-gray-500 hover:text-orange-600 transition-colors"
      >
        {{ t("auth.forgotPassword.backToLogin") }}
      </NuxtLink>
    </div>
  </div>
</template>
