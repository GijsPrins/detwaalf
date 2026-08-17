<script setup lang="ts">
definePageMeta({ layout: "auth" });

const { t } = useI18n();
useHead(() => ({ title: t("page.updatePassword") }));

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const password = ref("");
const passwordConfirm = ref("");
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const passwordsMatch = computed(
  () => password.value === passwordConfirm.value,
);
const canSubmit = computed(
  () =>
    password.value.length >= 6 &&
    passwordConfirm.value.length >= 6 &&
    passwordsMatch.value &&
    !loading.value,
);

async function updatePassword() {
  loading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  if (!user.value) {
    errorMessage.value = t("auth.updatePassword.errors.noSession");
    loading.value = false;
    return;
  }

  const { error } = await supabase.auth.updateUser({
    password: password.value,
  });

  if (error) {
    errorMessage.value = t("auth.updatePassword.errors.generic");
  } else {
    successMessage.value = t("auth.updatePassword.success");
    password.value = "";
    passwordConfirm.value = "";
  }

  loading.value = false;
}
</script>

<template>
  <div class="w-full max-w-sm px-6 py-8 bg-white rounded-xl border border-gray-100">
    <h1 class="text-2xl font-semibold text-gray-900 mb-2">
      {{ t("auth.updatePassword.title") }}
    </h1>
    <p class="text-sm text-gray-500 mb-6">
      {{ t("auth.updatePassword.subtitle") }}
    </p>

    <div
      v-if="successMessage"
      class="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm"
    >
      {{ successMessage }}
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="updatePassword">
      <div class="flex flex-col gap-1.5">
        <label for="password" class="text-sm font-medium text-gray-700">
          {{ t("auth.updatePassword.password") }}
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="password-confirm" class="text-sm font-medium text-gray-700">
          {{ t("auth.updatePassword.passwordConfirm") }}
        </label>
        <input
          id="password-confirm"
          v-model="passwordConfirm"
          type="password"
          autocomplete="new-password"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
      </div>

      <p
        v-if="passwordConfirm && !passwordsMatch"
        class="text-sm text-red-600"
      >
        {{ t("auth.updatePassword.errors.mismatch") }}
      </p>
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
            ? t("auth.updatePassword.loading")
            : t("auth.updatePassword.submit")
        }}
      </button>
    </form>

    <div class="mt-6 text-center">
      <NuxtLink
        to="/login"
        class="text-sm text-gray-500 hover:text-orange-600 transition-colors"
      >
        {{ t("auth.updatePassword.backToLogin") }}
      </NuxtLink>
    </div>
  </div>
</template>
