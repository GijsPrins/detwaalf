<script setup lang="ts">
import type { Enums } from '~/types/database.types'
import { DISTANCE_ORDER } from '~/constants/distances'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const route = useRoute()
const eventId = computed(() => route.params.id as string)

const { data: event, isPending: isLoadingEvent } = useEvent(eventId)
const { data: canEdit } = useCanManageEvents()
const { data: provinces } = useProvinces()
const { mutate, isPending, isError } = useUpdateEvent(eventId)

useHead(() => ({ title: t('eventForm.titleEdit') }))

const distanceOptions: { value: Enums<'distance_category'>; label: string }[] = DISTANCE_ORDER.map(cat => ({
  value: cat,
  label: t(`distance.${cat}`),
}))

const form = reactive({
  name: '',
  eventDate: '',
  distances: [] as Enums<'distance_category'>[],
  location: '',
  provinceId: null as number | null,
  eventUrl: '',
  registrationUrl: '',
  registrationOpens: '',
  registrationDeadline: '',
})

const nominatimLoading = ref(false)
const provinceAutoFilled = ref(false)

// Populate form once event data loads
watch(event, (e) => {
  if (!e) return
  form.name = e.name
  form.eventDate = e.eventDate
  form.distances = e.distances.map(d => d.distanceCategory)
  form.location = e.location ?? ''
  form.provinceId = e.provinceId
  form.eventUrl = e.eventUrl ?? ''
  form.registrationUrl = e.registrationUrl ?? ''
  form.registrationOpens = e.registrationOpens ?? ''
  form.registrationDeadline = e.registrationDeadline ?? ''
}, { immediate: true })

const canSubmit = computed(
  () => form.name.trim() && form.eventDate && form.distances.length > 0 && form.provinceId !== null && !isPending.value,
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
    distances: form.distances,
    province_id: form.provinceId!,
    location: form.location.trim() || null,
    event_url: form.eventUrl.trim() || null,
    registration_url: form.registrationUrl.trim() || null,
    registration_opens: form.registrationOpens || null,
    registration_deadline: form.registrationDeadline || null,
  })
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div class="mb-6">
      <NuxtLink
        :to="`/events/${eventId}`"
        class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← {{ t('eventDetail.backToEvent') }}
      </NuxtLink>
    </div>

    <div v-if="isLoadingEvent" class="text-sm text-gray-400 py-12 text-center">&hellip;</div>

    <div v-else-if="!canEdit" class="text-sm text-gray-500 py-12 text-center">
      {{ t('eventDetail.notFound') }}
    </div>

    <template v-else>
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">
        {{ t('eventForm.titleEdit') }}
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

        <!-- Datum -->
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

        <!-- Afstanden -->
        <div class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-700">{{ t('eventForm.fields.distances') }}</span>
          <div class="flex gap-5">
            <label
              v-for="option in distanceOptions"
              :key="option.value"
              class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <input
                v-model="form.distances"
                type="checkbox"
                :value="option.value"
                class="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              >
              {{ option.label }}
            </label>
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

        <!-- Inschrijflink -->
        <div class="flex flex-col gap-1.5">
          <label for="registrationUrl" class="text-sm font-medium text-gray-700">
            {{ t('eventForm.fields.registrationUrl') }}
            <span class="text-gray-400 font-normal">{{ t('eventForm.fields.optional') }}</span>
          </label>
          <input
            id="registrationUrl"
            v-model="form.registrationUrl"
            type="url"
            :placeholder="t('eventForm.fields.registrationUrlPlaceholder')"
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

        <!-- Error -->
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
            :to="`/events/${eventId}`"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t('eventForm.cancel') }}
          </NuxtLink>
        </div>
      </form>
    </template>
  </div>
</template>
