<script setup lang="ts">
import type { ContactMessageType } from "~/queries/contactMessages";

const { t } = useI18n();
useHead(() => ({ title: t("page.contact") }));

const type = ref<ContactMessageType>("general");
const message = ref("");
const emailOverride = ref("");
const submitted = ref(false);

const user = useSupabaseUser();
const sessionEmail = computed(() => user.value?.email ?? null);
const needsEmail = computed(() => !sessionEmail.value);

const { mutateAsync, isPending, isError } = useSubmitContactMessage();

const messageLength = computed(() => message.value.length);
const canSubmit = computed(
  () =>
    message.value.trim().length > 0 &&
    (!needsEmail.value || emailOverride.value.trim().length > 0) &&
    !isPending.value,
);

async function submit() {
  await mutateAsync({
    type: type.value,
    message: message.value.trim(),
    ...(needsEmail.value ? { email: emailOverride.value.trim() } : {}),
  });
  submitted.value = true;
}
</script>

<template>
  <div class="page-data-container">
    <h1 class="text-2xl font-bold text-gray-900 mb-1">
      {{ t("contact.title") }}
    </h1>
    <p class="text-sm text-gray-500 mb-8">
      {{ t("contact.subtitle") }}
    </p>

    <div v-if="submitted" class="space-y-2 border-t border-gray-100 pt-6">
      <p class="text-sm font-medium text-gray-900 mb-1">
        {{ t("contact.successTitle") }}
      </p>
      <p class="text-sm text-gray-500">{{ t("contact.successBody") }}</p>
    </div>

    <form v-else class="flex flex-col gap-5" @submit.prevent="submit">
      <!-- Type -->
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-900">{{
          t("contact.type.label")
        }}</label>
        <select
          v-model="type"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          <option value="general">{{ t("contact.type.general") }}</option>
          <option value="data_request">
            {{ t("contact.type.data_request") }}
          </option>
          <option value="delete_account">
            {{ t("contact.type.delete_account") }}
          </option>
        </select>
      </div>

      <!-- Email (only shown when not available from session) -->
      <div v-if="needsEmail" class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-gray-900">{{
          t("contact.email.label")
        }}</label>
        <input
          v-model="emailOverride"
          type="email"
          :placeholder="t('contact.email.placeholder')"
          required
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <!-- Message -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-baseline justify-between">
          <label class="text-sm font-medium text-gray-900">{{
            t("contact.message.label")
          }}</label>
          <span class="text-xs text-gray-400">{{ messageLength }}/2000</span>
        </div>
        <textarea
          v-model="message"
          :placeholder="t('contact.message.placeholder')"
          maxlength="2000"
          rows="5"
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
        />
      </div>

      <p v-if="isError" class="text-sm text-red-600">
        {{ t("contact.error") }}
      </p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isPending ? t("contact.submitting") : t("contact.submit") }}
      </button>
    </form>
  </div>
</template>
