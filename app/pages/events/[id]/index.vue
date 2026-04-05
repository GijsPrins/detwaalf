<script setup lang="ts">
import type { Enums } from '~/types/database.types'
import { formatEventDate } from '~/mappers/events'

definePageMeta({ auth: false })

const { t } = useI18n()
const route = useRoute()
const eventId = computed(() => route.params.id as string)

const user = useSupabaseUser()
const { data: event, isPending, isError } = useEvent(eventId)
const { data: canEdit } = useCanManageEvents()
const { mutate: setStatus, isPending: isSettingStatus } = useSetParticipation(eventId)

useHead(() => ({ title: event.value?.name ?? t('events.title') }))

const statusOptions: { value: Enums<'participation_status'>; label: string }[] = [
  { value: 'interested', label: t('events.status.interested') },
  { value: 'signed_up', label: t('events.status.signed_up') },
  { value: 'completed', label: t('events.status.completed') },
  { value: 'dns', label: t('events.status.dns') },
  { value: 'dnf', label: t('events.status.dnf') },
]

const statusActiveClass: Record<Enums<'participation_status'>, string> = {
  interested: 'bg-orange-100 text-orange-700',
  signed_up: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  dns: 'bg-gray-100 text-gray-500',
  dnf: 'bg-gray-100 text-gray-500',
}
</script>

<template>
  <div class="max-w-lg">
    <!-- Back + edit -->
    <div class="flex items-center justify-between mb-6">
      <NuxtLink
        to="/events"
        class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← {{ t('nav.events') }}
      </NuxtLink>
      <NuxtLink
        v-if="canEdit && event"
        :to="`/events/${event.id}/edit`"
        class="text-sm text-orange-600 hover:text-orange-700 transition-colors font-medium"
      >
        {{ t('eventDetail.edit') }}
      </NuxtLink>
    </div>

    <div v-if="isPending" class="text-sm text-gray-400 py-12 text-center">&hellip;</div>

    <div v-else-if="isError || !event" class="text-sm text-gray-500 py-12 text-center">
      {{ t('eventDetail.notFound') }}
    </div>

    <template v-else>
      <!-- Event info card -->
      <div class="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-1">
          {{ event.name }}
        </h1>
        <p class="text-sm text-gray-500">
          {{ event.provinceName }}
          · {{ t(`distance.${event.distanceCategory}`) }}
          · {{ formatEventDate(event.eventDate) }}
        </p>

        <div v-if="event.location || event.eventUrl || event.registrationOpens || event.registrationDeadline" class="mt-4 flex flex-col gap-2">
          <p v-if="event.location" class="text-sm text-gray-700">
            <span class="text-gray-400 text-xs uppercase tracking-wide mr-2">{{ t('eventDetail.location') }}</span>
            {{ event.location }}
          </p>
          <p v-if="event.registrationOpens" class="text-sm text-gray-700">
            <span class="text-gray-400 text-xs uppercase tracking-wide mr-2">{{ t('eventDetail.registrationOpens') }}</span>
            {{ formatEventDate(event.registrationOpens) }}
          </p>
          <p v-if="event.registrationDeadline" class="text-sm text-gray-700">
            <span class="text-gray-400 text-xs uppercase tracking-wide mr-2">{{ t('eventDetail.registrationDeadline') }}</span>
            {{ formatEventDate(event.registrationDeadline) }}
          </p>
          <a
            v-if="event.eventUrl"
            :href="event.eventUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-orange-600 hover:text-orange-700 transition-colors"
          >
            {{ t('eventDetail.website') }} →
          </a>
        </div>
      </div>

      <!-- Participation status card -->
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <p class="text-sm font-semibold text-gray-900 mb-3">
          {{ t('eventDetail.participation.title') }}
        </p>

        <template v-if="user">
          <p class="text-xs text-gray-400 mb-3">
            {{ t('eventDetail.participation.set') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in statusOptions"
              :key="option.value"
              :disabled="isSettingStatus"
              class="px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50"
              :class="event.participationStatus === option.value
                ? statusActiveClass[option.value]
                : 'text-gray-500 hover:text-gray-900'"
              @click="setStatus(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </template>

        <p v-else class="text-sm text-gray-500">
          <NuxtLink to="/login" class="text-orange-600 hover:text-orange-700 transition-colors">
            {{ t('eventDetail.participation.loginLink') }}</NuxtLink>
          {{ t('eventDetail.participation.loginSuffix') }}
        </p>
      </div>
    </template>
  </div>
</template>
