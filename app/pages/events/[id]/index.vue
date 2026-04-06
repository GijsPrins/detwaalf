<script setup lang="ts">
import type { Enums } from '~/types/database.types'
import { formatEventDate } from '~/mappers/events'
import { PARTICIPATION_STATUS_BADGE_CLASS } from '~/constants/participation'

definePageMeta({ auth: false })

const { t } = useI18n()
const route = useRoute()
const eventId = computed(() => route.params.id as string)

const user = useSupabaseUser()
const { data: event, isPending, isError } = useEvent(eventId)
const { data: canEdit } = useCanManageEvents()
const { mutate: setStatus, isPending: isSettingStatus } = useSetParticipation(eventId)
const { mutate: clearStatus, isPending: isClearingStatus } = useClearParticipation(eventId)

useHead(() => ({ title: event.value?.name ?? t('events.title') }))

const statusOptions: { value: Enums<'participation_status'>; label: string }[] = [
  { value: 'interested', label: t('events.status.interested') },
  { value: 'signed_up', label: t('events.status.signed_up') },
  { value: 'completed', label: t('events.status.completed') },
  { value: 'dns', label: t('events.status.dns') },
  { value: 'dnf', label: t('events.status.dnf') },
]

const hasDetails = computed(() =>
  !!(event.value?.location || event.value?.registrationOpens || event.value?.registrationDeadline || event.value?.eventUrl || event.value?.registrationUrl)
)
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Back + edit -->
    <div class="flex items-center justify-between mb-8">
      <NuxtLink
        to="/events"
        class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← {{ t('nav.events') }}
      </NuxtLink>
      <NuxtLink
        v-if="canEdit && event"
        :to="`/events/${event.id}/edit`"
        class="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        {{ t('eventDetail.edit') }}
      </NuxtLink>
    </div>

    <div v-if="isPending" class="text-sm text-gray-400 py-12 text-center">&hellip;</div>

    <div v-else-if="isError || !event" class="text-sm text-gray-500 py-12 text-center">
      {{ t('eventDetail.notFound') }}
    </div>

    <template v-else>
      <!-- Event header -->
      <div class="flex items-start justify-between gap-6 mb-6">
        <div class="min-w-0">
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            {{ event.name }}
          </h1>
          <p class="text-sm text-gray-500 mt-2">
            {{ event.provinceName }}
            · {{ t(`distance.${event.distanceCategory}`) }}
            · {{ formatEventDate(event.eventDate) }}
          </p>
        </div>
        <div class="shrink-0 w-40 h-40">
          <ProvinceShape :province-id="event.provinceId" />
        </div>
      </div>

      <!-- Details -->
      <div v-if="hasDetails" class="flex flex-col gap-2.5 mb-8">
        <div v-if="event.location" class="flex gap-4">
          <span class="text-xs text-gray-400 w-36 shrink-0 pt-0.5 uppercase tracking-wide">
            {{ t('eventDetail.location') }}
          </span>
          <span class="text-sm text-gray-700">{{ event.location }}</span>
        </div>
        <div v-if="event.registrationOpens" class="flex gap-4">
          <span class="text-xs text-gray-400 w-36 shrink-0 pt-0.5 uppercase tracking-wide">
            {{ t('eventDetail.registrationOpens') }}
          </span>
          <span class="text-sm text-gray-700">{{ formatEventDate(event.registrationOpens) }}</span>
        </div>
        <div v-if="event.registrationDeadline" class="flex gap-4">
          <span class="text-xs text-gray-400 w-36 shrink-0 pt-0.5 uppercase tracking-wide">
            {{ t('eventDetail.registrationDeadline') }}
          </span>
          <span class="text-sm text-gray-700">{{ formatEventDate(event.registrationDeadline) }}</span>
        </div>
        <div v-if="event.eventUrl || event.registrationUrl" class="flex gap-4 mt-1">
          <span class="w-36 shrink-0" />
          <div class="flex flex-wrap gap-2">
            <a
              v-if="event.registrationUrl"
              :href="event.registrationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
            >
              {{ t('eventDetail.register') }} →
            </a>
            <a
              v-if="event.eventUrl"
              :href="event.eventUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {{ t('eventDetail.website') }} →
            </a>
          </div>
        </div>
      </div>

      <!-- Participation -->
      <div class="border-t border-gray-100 pt-6">
        <p class="text-sm font-semibold text-gray-900 mb-3">
          {{ t('eventDetail.participation.title') }}
        </p>

        <template v-if="user">
          <!-- Current status -->
          <div v-if="event.participationStatus" class="mb-3">
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="PARTICIPATION_STATUS_BADGE_CLASS[event.participationStatus]"
            >
              {{ t(`events.status.${event.participationStatus}`) }}
            </span>
          </div>

          <p class="text-xs text-gray-400 mb-3">
            {{ t('eventDetail.participation.set') }}
          </p>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              :disabled="isSettingStatus || isClearingStatus"
              class="px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
              :class="event.participationStatus === option.value
                ? PARTICIPATION_STATUS_BADGE_CLASS[option.value]
                : 'text-gray-500 hover:text-gray-900'"
              @click="setStatus(option.value)"
            >
              {{ option.label }}
            </button>
            <button
              v-if="event.participationStatus"
              :disabled="isSettingStatus || isClearingStatus"
              class="px-3 py-1 rounded-full text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              @click="clearStatus()"
            >
              {{ t('eventDetail.participation.clear') }}
            </button>
          </div>
        </template>

        <p v-else class="text-sm text-gray-500">
          <NuxtLink to="/login" class="text-orange-600 hover:text-orange-700 transition-colors">
            {{ t('eventDetail.participation.loginLink') }}
          </NuxtLink>
          {{ t('eventDetail.participation.loginSuffix') }}
        </p>
      </div>
    </template>
  </div>
</template>
