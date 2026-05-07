<script setup lang="ts">
import { hasConfirmedEmail } from "~/utils/emailConfirmation";

definePageMeta({ layout: "auth" });

const { t } = useI18n();
useHead(() => ({ title: t("page.verifyEmail") }));

const supabase = useSupabaseClient();
const user = useSupabaseUser();

watchEffect(() => {
  const u = user.value;
  if (hasConfirmedEmail(u)) navigateTo("/dashboard");
});

const cooldown = ref(0);
const isResending = ref(false);
const resendSuccess = ref(false);
const resendError = ref(false);

let cooldownTimer: ReturnType<typeof setInterval> | null = null;

async function resend() {
  if (!user.value?.email || cooldown.value > 0) return;

  isResending.value = true;
  resendSuccess.value = false;
  resendError.value = false;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.value.email,
  });

  isResending.value = false;

  if (error) {
    resendError.value = true;
  } else {
    resendSuccess.value = true;
    cooldown.value = 60;
    cooldownTimer = setInterval(() => {
      cooldown.value--;
      if (cooldown.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }
    }, 1000);
  }
}

async function logout() {
  await supabase.auth.signOut();
  navigateTo("/login");
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});
</script>

<template>
  <div
    class="w-full max-w-sm px-6 py-8 bg-white rounded-xl border border-gray-100"
  >
    <h1 class="text-2xl font-semibold text-gray-900 mb-2">
      {{ t("verifyEmail.title") }}
    </h1>
    <p class="text-sm text-gray-500 mb-6">
      {{ t("verifyEmail.subtitle") }}
      <span v-if="user?.email" class="font-medium text-gray-700">{{
        user.email
      }}</span
      >.
    </p>

    <p
      v-if="resendSuccess"
      class="mb-4 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200"
    >
      {{ t("verifyEmail.resendSuccess") }}
    </p>
    <p
      v-if="resendError"
      class="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200"
    >
      {{ t("verifyEmail.resendError") }}
    </p>

    <div class="flex flex-col gap-3">
      <button
        :disabled="isResending || cooldown > 0"
        class="w-full rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="resend"
      >
        <span v-if="isResending">{{ t("verifyEmail.resending") }}</span>
        <span v-else-if="cooldown > 0">{{
          t("verifyEmail.resendCooldown", { seconds: cooldown })
        }}</span>
        <span v-else>{{ t("verifyEmail.resend") }}</span>
      </button>

      <button
        class="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
        @click="logout"
      >
        {{ t("verifyEmail.logout") }}
      </button>
    </div>
  </div>
</template>
