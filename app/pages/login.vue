<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
useHead(() => ({ title: t('page.login') }))
const supabase = useSupabaseClient()
const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/dashboard')
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const canSubmit = computed(() => email.value.length > 0 && password.value.length > 0 && !loading.value)

async function login() {
  loading.value = true
  errorMessage.value = null

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    if (error.message.toLowerCase().includes('invalid')) {
      errorMessage.value = t('auth.login.errors.invalidCredentials')
    } else if (error.message.toLowerCase().includes('confirm')) {
      errorMessage.value = t('auth.login.errors.emailNotConfirmed')
    } else {
      errorMessage.value = t('auth.login.errors.generic')
    }
  }

  loading.value = false
}
</script>

<template>
  <div class="w-full max-w-sm px-6 py-8 bg-white rounded-xl border border-gray-100">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">
      {{ t('auth.login.title') }}
    </h1>

    <form class="flex flex-col gap-4" @submit.prevent="login">
      <div class="flex flex-col gap-1.5">
        <label for="email" class="text-sm font-medium text-gray-700">
          {{ t('auth.login.email') }}
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

      <div class="flex flex-col gap-1.5">
        <label for="password" class="text-sm font-medium text-gray-700">
          {{ t('auth.login.password') }}
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
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
        {{ loading ? t('auth.login.loading') : t('auth.login.submit') }}
      </button>
    </form>
  </div>
</template>
