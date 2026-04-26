<script setup lang="ts">
const { t } = useI18n();
const user = useSupabaseUser();
const { profile, isLoading, updateProfile, isSaving } = useProfile();

useHead({ title: computed(() => t("page.profile")) });

const displayName = ref("");
const isPublic = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

// Populate form when profile loads
watch(
  profile,
  (val) => {
    if (val) {
      displayName.value = val.display_name ?? "";
      isPublic.value = val.is_public;
    }
  },
  { immediate: true },
);

async function save() {
  successMessage.value = "";
  errorMessage.value = "";
  try {
    await updateProfile({
      display_name: displayName.value.trim() || null,
      is_public: isPublic.value,
    });
    successMessage.value = t("profile.saveSuccess");
  } catch (err) {
    console.error("[profile] save error:", err);
    errorMessage.value = t("profile.saveError");
  }
}

const isDirty = computed(() => {
  const currentName = profile.value?.display_name ?? "";
  const currentPublic = profile.value?.is_public ?? false;
  return displayName.value !== currentName || isPublic.value !== currentPublic;
});
</script>

<template>
  <div class="page-data-container">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">
        {{ t("profile.title") }}
      </h1>
      <p class="text-sm text-gray-500">{{ t("profile.subtitle") }}</p>
    </div>

    <div v-if="isLoading" class="text-sm text-gray-400">
      {{ t("profile.loading") }}
    </div>

    <form v-else class="flex flex-col gap-6" @submit.prevent="save">
      <div class="flex items-center gap-4 pb-6 border-b border-gray-100">
        <div
          class="flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 shrink-0"
        >
          <span class="text-white text-xl font-bold">
            {{
              (displayName || user?.email || "?")
                .split(/[\s@]+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? "")
                .join("")
            }}
          </span>
        </div>
        <div class="min-w-0 flex flex-col gap-0.5">
          <span class="text-sm font-semibold text-gray-900 truncate">{{
            displayName || user?.email
          }}</span>
          <span class="text-xs text-gray-400 truncate">{{ user?.email }}</span>
        </div>
      </div>

      <div class="flex flex-col gap-5">
        <h2 class="text-sm font-semibold text-gray-900">
          {{ t("profile.sectionGeneral") }}
        </h2>

        <div class="flex flex-col gap-1.5">
          <label for="display-name" class="text-sm font-medium text-gray-700">
            {{ t("profile.displayName") }}
          </label>
          <input
            id="display-name"
            v-model="displayName"
            type="text"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            :placeholder="t('profile.displayNamePlaceholder')"
            maxlength="60"
          />
          <p class="text-xs text-gray-400">
            {{ t("profile.displayNameHint") }}
          </p>
        </div>

        <div
          class="flex items-center justify-between gap-4 border-t border-gray-100 pt-5"
        >
          <div class="min-w-0">
            <span class="block text-sm font-medium text-gray-700">{{
              t("profile.publicProfile")
            }}</span>
            <span class="block text-xs text-gray-400 mt-0.5">{{
              t("profile.publicProfileHint")
            }}</span>
          </div>
          <label
            for="is-public"
            class="relative inline-flex items-center cursor-pointer shrink-0"
          >
            <input
              id="is-public"
              v-model="isPublic"
              type="checkbox"
              class="sr-only peer"
            />
            <span
              class="w-10 h-6 rounded-full bg-gray-200 peer-checked:bg-gray-900 transition-colors"
            />
            <span
              class="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
            />
          </label>
        </div>
      </div>

      <p
        v-if="successMessage"
        class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
      >
        {{ successMessage }}
      </p>
      <p
        v-if="errorMessage"
        class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
      >
        {{ errorMessage }}
      </p>

      <div class="flex justify-end">
        <button
          type="submit"
          class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSaving || !isDirty"
        >
          <span v-if="isSaving">{{ t("profile.saving") }}</span>
          <span v-else>{{ t("profile.save") }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
