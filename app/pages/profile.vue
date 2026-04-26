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
  <div class="profile-page max-w-lg mx-auto">
    <div class="profile-page__header">
      <h1 class="profile-page__title">{{ t("profile.title") }}</h1>
      <p class="profile-page__subtitle">{{ t("profile.subtitle") }}</p>
    </div>

    <div v-if="isLoading" class="profile-page__loading">
      {{ t("profile.loading") }}
    </div>

    <form v-else class="profile-page__form" @submit.prevent="save">
      <!-- Avatar placeholder -->
      <div class="profile-form-section">
        <div class="profile-avatar">
          <span class="profile-avatar__initials">
            {{
              (displayName || user?.email || "?")
                .split(/[\s@]+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? "")
                .join("")
            }}
          </span>
        </div>
        <div class="profile-avatar__info">
          <span class="profile-avatar__name">{{
            displayName || user?.email
          }}</span>
          <span class="profile-avatar__email">{{ user?.email }}</span>
        </div>
      </div>

      <div class="profile-form-section">
        <h2 class="profile-form-section__title">
          {{ t("profile.sectionGeneral") }}
        </h2>

        <div class="profile-field">
          <label for="display-name" class="profile-field__label">
            {{ t("profile.displayName") }}
          </label>
          <input
            id="display-name"
            v-model="displayName"
            type="text"
            class="profile-field__input"
            :placeholder="t('profile.displayNamePlaceholder')"
            maxlength="60"
          />
          <p class="profile-field__hint">{{ t("profile.displayNameHint") }}</p>
        </div>

        <div class="profile-field">
          <label class="profile-toggle" for="is-public">
            <div class="profile-toggle__info">
              <span class="profile-toggle__label">{{
                t("profile.publicProfile")
              }}</span>
              <span class="profile-toggle__hint">{{
                t("profile.publicProfileHint")
              }}</span>
            </div>
            <div class="profile-toggle__control">
              <input
                id="is-public"
                v-model="isPublic"
                type="checkbox"
                class="profile-toggle__checkbox"
              />
              <span class="profile-toggle__track">
                <span class="profile-toggle__thumb" />
              </span>
            </div>
          </label>
        </div>
      </div>

      <Transition name="fade">
        <p
          v-if="successMessage"
          class="profile-feedback profile-feedback--success"
        >
          {{ successMessage }}
        </p>
      </Transition>
      <Transition name="fade">
        <p v-if="errorMessage" class="profile-feedback profile-feedback--error">
          {{ errorMessage }}
        </p>
      </Transition>

      <div class="profile-actions">
        <button
          type="submit"
          class="profile-actions__save"
          :disabled="isSaving || !isDirty"
        >
          <span v-if="isSaving">{{ t("profile.saving") }}</span>
          <span v-else>{{ t("profile.save") }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-page__header {
  margin-bottom: 32px;
}

.profile-page__title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
}

.profile-page__subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.profile-page__loading {
  font-size: 14px;
  color: #9ca3af;
}

/* Form sections */
.profile-form-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-form-section:first-of-type {
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.profile-form-section__title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Avatar */
.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 9999px;
  background: #111827;
  flex-shrink: 0;
}

.profile-avatar__initials {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.profile-avatar__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.profile-avatar__name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-avatar__email {
  font-size: 13px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Fields */
.profile-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-field__label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.profile-field__input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  background: #fff;
}

.profile-field__input:focus {
  border-color: #374151;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.06);
}

.profile-field__hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

/* Toggle */
.profile-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
}

.profile-toggle__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-toggle__label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.profile-toggle__hint {
  font-size: 12px;
  color: #9ca3af;
}

.profile-toggle__control {
  flex-shrink: 0;
}

.profile-toggle__checkbox {
  display: none;
}

.profile-toggle__track {
  display: flex;
  align-items: center;
  width: 40px;
  height: 24px;
  border-radius: 9999px;
  background: #e5e7eb;
  padding: 2px;
  transition: background 0.2s;
  cursor: pointer;
}

.profile-toggle__checkbox:checked + .profile-toggle__track {
  background: #111827;
}

.profile-toggle__thumb {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}

.profile-toggle__checkbox:checked
  + .profile-toggle__track
  .profile-toggle__thumb {
  transform: translateX(16px);
}

/* Feedback */
.profile-feedback {
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 8px;
  margin: 0 0 8px;
}

.profile-feedback--success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.profile-feedback--error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Actions */
.profile-actions {
  display: flex;
  justify-content: flex-end;
}

.profile-actions__save {
  height: 38px;
  padding: 0 20px;
  background: #111827;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s;
}

.profile-actions__save:hover:not(:disabled) {
  background: #1f2937;
}

.profile-actions__save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
