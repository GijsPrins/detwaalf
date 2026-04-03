<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
useHead(() => ({ title: t('page.login') }))
const user = useSupabaseUser()
const error = ref(false)

watchEffect(() => {
  if (user.value) navigateTo('/dashboard')
})

// If the user is not resolved within 5 seconds, show an error
setTimeout(() => {
  if (!user.value) error.value = true
}, 5000)
</script>

<template>
  <div class="w-full max-w-sm px-6 py-8 text-center">
    <p v-if="error" class="text-sm text-red-600">
      {{ t('auth.confirm.error') }}
    </p>
    <p v-else class="text-sm text-gray-500">
      {{ t('auth.confirm.loading') }}
    </p>
  </div>
</template>
