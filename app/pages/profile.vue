<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import type { Database } from '~/types/database.types'
import type { ProfileWithSlug } from '~/queries/profiles'
import { generateProfileSlug } from '~/utils/profileSlug'

const { t } = useI18n()
const user = useSupabaseUser()
const supabase = useSupabaseClient<Database>()
const queryClient = useQueryClient()
const { profile, isLoading, updateProfile, isSaving } = useProfile()

useHead({ title: computed(() => t('page.profile')) })

const displayName = ref('')
const isPublic = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const isGeneratingSlug = ref(false)
const copied = ref(false)
const showRerollConfirm = ref(false)

const profileWithSlug = computed(() => profile.value as ProfileWithSlug | null)
const slug = computed(() => profileWithSlug.value?.slug ?? null)

const profileUrl = computed(() =>
  slug.value ? `https://twaalfprovincies.run/profile/${slug.value}` : null,
)

watch(
  profile,
  (val) => {
    if (val) {
      displayName.value = val.display_name ?? ''
      isPublic.value = val.is_public
    }
  },
  { immediate: true },
)

// Persists a new slug without changing any other profile fields.
// 'slug' is not in the generated DB types yet — remove cast after regenerating types.
async function persistSlug(newSlug: string) {
  if (!user.value) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('profiles')
    .update({ slug: newSlug } as unknown as Database['public']['Tables']['profiles']['Update'])
    .eq('id', user.value.id)
  if (error) throw error
  const current = queryClient.getQueryData<ProfileWithSlug | null>(['profile', 'self'])
  if (current) {
    queryClient.setQueryData(['profile', 'self'], { ...current, slug: newSlug })
  }
}

async function openPreview() {
  let currentSlug = slug.value
  if (!currentSlug) {
    isGeneratingSlug.value = true
    try {
      currentSlug = await generateProfileSlug(supabase, 'nl')
      await persistSlug(currentSlug)
    } catch {
      isGeneratingSlug.value = false
      return
    }
    isGeneratingSlug.value = false
  }
  window.open(`/profile/${currentSlug}`, '_blank')
}

async function copyLink() {
  if (!profileUrl.value) return
  await navigator.clipboard.writeText(profileUrl.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

async function rerollSlug() {
  showRerollConfirm.value = false
  isGeneratingSlug.value = true
  try {
    const newSlug = await generateProfileSlug(supabase, 'nl')
    await persistSlug(newSlug)
  } catch {
    errorMessage.value = t('profile.saveError')
  } finally {
    isGeneratingSlug.value = false
  }
}

async function save() {
  successMessage.value = ''
  errorMessage.value = ''
  try {
    // If enabling public for the first time and no slug yet, generate one
    if (isPublic.value && !slug.value) {
      isGeneratingSlug.value = true
      const newSlug = await generateProfileSlug(supabase, 'nl')
      await persistSlug(newSlug)
      isGeneratingSlug.value = false
    }
    await updateProfile({
      display_name: displayName.value.trim() || null,
      is_public: isPublic.value,
    })
    successMessage.value = t('profile.saveSuccess')
  } catch (err) {
    console.error('[profile] save error:', err)
    isGeneratingSlug.value = false
    errorMessage.value = t('profile.saveError')
  }
}

const isDirty = computed(() => {
  const currentName = profile.value?.display_name ?? ''
  const currentPublic = profile.value?.is_public ?? false
  return displayName.value !== currentName || isPublic.value !== currentPublic
})
</script>

<template>
  <div class="page-data-container">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">
        {{ t('profile.title') }}
      </h1>
      <p class="text-sm text-gray-500">{{ t('profile.subtitle') }}</p>
    </div>

    <div v-if="isLoading" class="text-sm text-gray-400">
      {{ t('profile.loading') }}
    </div>

    <form v-else class="flex flex-col gap-6" @submit.prevent="save">
      <div class="flex items-center gap-4 pb-6 border-b border-gray-100">
        <div
          class="flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 shrink-0"
        >
          <span class="text-white text-xl font-bold">
            {{
              (displayName || user?.email || '?')
                .split(/[\s@]+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase() ?? '')
                .join('')
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
          {{ t('profile.sectionGeneral') }}
        </h2>

        <div class="flex flex-col gap-1.5">
          <label for="display-name" class="text-sm font-medium text-gray-700">
            {{ t('profile.displayName') }}
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
            {{ t('profile.displayNameHint') }}
          </p>
        </div>

        <div class="flex flex-col gap-4 border-t border-gray-100 pt-5">
          <!-- Toggle row -->
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <span class="block text-sm font-medium text-gray-700">{{
                t('profile.publicProfile')
              }}</span>
              <span class="block text-xs text-gray-400 mt-0.5">{{
                t('profile.publicProfileHint')
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

          <!-- Explainer -->
          <p class="text-xs text-gray-500 leading-relaxed">
            {{ t('profile.publicExplainer') }}
          </p>

          <!-- Preview button — always visible -->
          <button
            type="button"
            class="self-start text-sm text-orange-600 hover:text-orange-700 transition-colors"
            :disabled="isGeneratingSlug"
            @click="openPreview"
          >
            <span v-if="isGeneratingSlug">{{ t('profile.previewGenerating') }}</span>
            <span v-else>{{ t('profile.previewLink') }} →</span>
          </button>
        </div>

        <!-- Share link section (shown once slug exists) -->
        <div
          v-if="slug"
          class="flex flex-col gap-3 border-t border-gray-100 pt-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">
              {{ t('profile.shareSection') }}
              <span v-if="!isPublic" class="text-xs text-gray-400 font-normal ml-1">
                {{ t('profile.shareNotPublic') }}
              </span>
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="flex-1 min-w-0 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate"
            >
              {{ profileUrl }}
            </span>
            <button
              type="button"
              class="shrink-0 text-sm text-orange-600 hover:text-orange-700 transition-colors"
              @click="copyLink"
            >
              {{ copied ? t('profile.copied') : t('profile.copyLink') }}
            </button>
          </div>

          <!-- Reroll -->
          <div v-if="!showRerollConfirm">
            <button
              type="button"
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              :disabled="isGeneratingSlug"
              @click="showRerollConfirm = true"
            >
              {{ isGeneratingSlug ? t('profile.previewGenerating') : t('profile.rerollSlug') }}
            </button>
          </div>
          <div v-else class="flex flex-col gap-2">
            <p class="text-xs text-gray-500">{{ t('profile.rerollConfirmText') }}</p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                @click="rerollSlug"
              >
                {{ t('profile.rerollConfirmYes') }}
              </button>
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                @click="showRerollConfirm = false"
              >
                {{ t('profile.rerollConfirmNo') }}
              </button>
            </div>
          </div>
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
          <span v-if="isSaving">{{ t('profile.saving') }}</span>
          <span v-else>{{ t('profile.save') }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
