<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
useHead(() => ({ title: t('page.login') }))
const user = useSupabaseUser()
const confirmed = ref(false)
const error = ref(false)

watchEffect(() => {
  if (user.value) {
    confirmed.value = true
    setTimeout(() => navigateTo('/dashboard'), 2500)
  }
})

// If the user is not resolved within 5 seconds, show an error
setTimeout(() => {
  if (!user.value) error.value = true
}, 5000)
</script>

<template>
  <div class="w-full max-w-sm px-6 py-8 text-center">
    <template v-if="confirmed">
      <p class="text-base font-semibold text-gray-900 mb-1">
        {{ t('auth.confirm.success') }}
      </p>
      <p class="text-sm text-gray-500">
        {{ t('auth.confirm.redirecting') }}
      </p>
    </template>
    <p v-else-if="error" class="text-sm text-red-600">
      {{ t('auth.confirm.error') }}
    </p>
    <p v-else class="text-sm text-gray-500">
      {{ t('auth.confirm.loading') }}
    </p>
  </div>
</template>
