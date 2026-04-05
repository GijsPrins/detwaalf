<script setup lang="ts">
import type { Enums } from '~/types/database.types'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
useHead(() => ({ title: t('eventForm.titleAdd') }))

const { data: provinces } = useProvinces()
const { mutate, isPending, isError } = useAddEvent()

const form = reactive({
  name: '',
  eventDate: '',
  distanceCategory: '' as Enums<'distance_category'> | '',
  location: '',
  provinceId: null as number | null,
  eventUrl: '',
  registrationOpens: '',
  registrationDeadline: '',
})

const provinceAutoFilled = ref(false)
const nominatimLoading = ref(false)

const canSubmit = computed(
  () => form.name.trim() && form.eventDate && form.distanceCategory && form.provinceId !== null && !isPending.value,
)

async function lookupProvince() {
  if (!form.location.trim() || !provinces.value?.length) return

  nominatimLoading.value = true
  provinceAutoFilled.value = false

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.location)}&countrycodes=nl&format=json&addressdetails=1&limit=1&accept-language=nl`,
      { headers: { 'User-Agent': 'TwaalfProvincies/1.0 (twaalfprovincies.run)' } },
    )
    const results: { address?: { state?: string } }[] = await res.json()
    const stateName = results[0]?.address?.state
    if (!stateName) return

    const match = provinces.value.find(
      p =>
        p.name.toLowerCase() === stateName.toLowerCase() ||
        (p.name === 'Friesland' && stateName === 'Fryslân'),
    )

    if (match) {
      form.provinceId = match.id
      provinceAutoFilled.value = true
    }
  } catch {
    // Silent fail — user can select manually
  } finally {
    nominatimLoading.value = false
  }
}

function submit() {
  if (!canSubmit.value) return
  mutate({
    name: form.name.trim(),
    event_date: form.eventDate,
    distance_category: form.distanceCategory as Enums<'distance_category'>,
    province_id: form.provinceId!,
    location: form.location.trim() || null,
    event_url: form.eventUrl.trim() || null,
    registration_opens: form.registrationOpens || null,
    registration_deadline: form.registrationDeadline || null,
  })
}
</script>

<template>
  <div class="max-w-lg">
    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">
      {{ t('eventForm.titleAdd') }}
    </h1>

    <form class="flex flex-col gap-5" @submit.prevent="submit">
      <!-- Naam -->
      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-gray-700">
          {{ t('eventForm.fields.name') }}
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
      </div>

      <!-- Datum + Medailletrack -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="eventDate" class="text-sm font-medium text-gray-700">
            {{ t('eventForm.fields.date') }}
          </label>
          <input
            id="eventDate"
            v-model="form.eventDate"
            type="date"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="distanceCategory" class="text-sm font-medium text-gray-700">
            {{ t('eventForm.fields.distanceCategory') }}
          </label>
          <select
            id="distanceCategory"
            v-model="form.distanceCategory"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white"
          >
            <option value="" disabled>{{ t('eventForm.fields.distancePlaceholder') }}</option>
            <option value="10k">{{ t('distance.10k') }}</option>
            <option value="half">{{ t('distance.half') }}</option>
            <option value="marathon">{{ t('distance.marathon') }}</option>
          </select>
        </div>
      </div>

      <!-- Locatie -->
      <div class="flex flex-col gap-1.5">
        <label for="location" class="text-sm font-medium text-gray-700">
          {{ t('eventForm.fields.location') }}
          <span class="text-gray-400 font-normal">{{ t('eventForm.fields.optional') }}</span>
        </label>
        <input
          id="location"
          v-model="form.location"
          type="text"
          :placeholder="t('eventForm.fields.locationPlaceholder')"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          @blur="lookupProvince"
        >
      </div>

      <!-- Provincie -->
      <div class="flex flex-col gap-1.5">
        <label for="province" class="text-sm font-medium text-gray-700">
          {{ t('eventForm.fields.province') }}
        </label>
        <select
          id="province"
          v-model="form.provinceId"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white"
          :disabled="nominatimLoading"
        >
          <option :value="null" disabled>{{ t('eventForm.fields.provincePlaceholder') }}</option>
          <option v-for="province in provinces" :key="province.id" :value="province.id">
            {{ province.name }}
          </option>
        </select>
        <p v-if="provinceAutoFilled" class="text-xs text-orange-600">
          {{ t('eventForm.provinceAutoFilled') }}
        </p>
      </div>

      <!-- Website -->
      <div class="flex flex-col gap-1.5">
        <label for="eventUrl" class="text-sm font-medium text-gray-700">
          {{ t('eventForm.fields.eventUrl') }}
          <span class="text-gray-400 font-normal">{{ t('eventForm.fields.optional') }}</span>
        </label>
        <input
          id="eventUrl"
          v-model="form.eventUrl"
          type="url"
          :placeholder="t('eventForm.fields.eventUrlPlaceholder')"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
      </div>

      <!-- Inschrijving opent + deadline -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="registrationOpens" class="text-sm font-medium text-gray-700">
            {{ t('eventForm.fields.registrationOpens') }}
            <span class="text-gray-400 font-normal">{{ t('eventForm.fields.optional') }}</span>
          </label>
          <input
            id="registrationOpens"
            v-model="form.registrationOpens"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="registrationDeadline" class="text-sm font-medium text-gray-700">
            {{ t('eventForm.fields.registrationDeadline') }}
            <span class="text-gray-400 font-normal">{{ t('eventForm.fields.optional') }}</span>
          </label>
          <input
            id="registrationDeadline"
            v-model="form.registrationDeadline"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
        </div>
      </div>

      <!-- Hint + error -->
      <p class="text-xs text-orange-600">
        {{ t('eventForm.hint') }}
      </p>
      <p v-if="isError" class="text-sm text-red-600">
        {{ t('eventForm.errors.generic') }}
      </p>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-1">
        <button
          type="submit"
          :disabled="!canSubmit"
          class="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isPending ? '…' : t('eventForm.submit') }}
        </button>
        <NuxtLink
          to="/events"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          {{ t('eventForm.cancel') }}
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
