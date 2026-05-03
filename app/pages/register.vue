<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
useHead(() => ({ title: t('page.register') }))
const supabase = useSupabaseClient()
const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) navigateTo('/dashboard')
})

const email = ref('')
const password = ref('')
const name = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const canSubmit = computed(() => email.value.length > 0 && password.value.length >= 6 && loading.value === false)

async function register() {
  loading.value = true
  errorMessage.value = null
  successMessage.value = null

  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        display_name: name.value,
      },
      emailRedirectTo: `${window.location.origin}/confirm`,
    }
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      errorMessage.value = t('auth.register.errors.alreadyExists')
    } else {
      errorMessage.value = t('auth.register.errors.generic')
    }
  } else {
    // Usually need email confirmation if enabled
    successMessage.value = t('auth.register.success')
    email.value = ''
    password.value = ''
    name.value = ''
  }

  loading.value = false
}
</script>

<template>
  <div class="w-full max-w-sm px-6 py-8 bg-white rounded-xl border border-gray-100">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">
      {{ t('auth.register.title') }}
    </h1>

    <div v-if="successMessage" class="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
      {{ successMessage }}
    </div>

    <form v-else class="flex flex-col gap-4" @submit.prevent="register">
      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-gray-700">
          {{ t('auth.register.name') }}
        </label>
        <input
          id="name"
          v-model="name"
          type="text"
          autocomplete="name"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="email" class="text-sm font-medium text-gray-700">
          {{ t('auth.register.email') }}
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
          {{ t('auth.register.password') }}
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

      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="!canSubmit"
        class="mt-2 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? t('auth.register.loading') : t('auth.register.submit') }}
      </button>
    </form>

    <div class="mt-6 text-center">
      <NuxtLink to="/login" class="text-sm text-gray-500 hover:text-orange-600 transition-colors">
        {{ t('auth.register.hasAccount') }}
      </NuxtLink>
    </div>
  </div>
</template>
