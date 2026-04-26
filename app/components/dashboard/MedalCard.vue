<script setup lang="ts">
defineProps<{
  medal: string
  label: string
  count: number
  total: number
  color: string
  badgeClass: string
  provinceSelected: boolean
  eventId: string | null
  eventName: string | null
  eventDate: string | null
  finishTime: string | null
  compact?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="bg-white rounded-xl border border-gray-100"
    :class="compact ? 'p-3' : 'p-5'"
  >
    <!-- Desktop: label + badge row -->
    <div v-if="!compact" class="flex items-start justify-between mb-2">
      <span class="text-sm text-gray-700">{{ label }}</span>
      <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="badgeClass">{{ medal }}</span>
    </div>
    <!-- Mobile: badge only -->
    <span v-else class="text-xs font-medium px-2 py-0.5 rounded-full inline-block" :class="badgeClass">{{ medal }}</span>

    <div :class="!compact ? 'min-h-14' : ''">
      <!-- Province selected -->
      <template v-if="provinceSelected">
        <NuxtLink
          v-if="eventId"
          :to="`/events/${eventId}`"
          :class="compact
            ? 'mt-2 text-xs font-medium text-gray-900 leading-tight line-clamp-2 block hover:text-orange-700 transition-colors'
            : 'text-sm font-medium text-gray-900 hover:text-orange-700 transition-colors'"
        >
          {{ eventName }}
        </NuxtLink>
        <p
          v-else
          :class="compact ? 'mt-2 text-xs text-gray-400' : 'text-sm text-gray-400'"
        >
          {{ t('dashboard.noMedalForProvince') }}
        </p>
        <p v-if="eventDate" class="text-xs text-gray-400 mt-0.5">
          {{ eventDate }}<template v-if="finishTime"> · {{ finishTime }}</template>
        </p>
      </template>

      <!-- Default: count + progress bar -->
      <template v-else>
        <div :class="compact ? 'mt-2 text-xl font-bold text-gray-900 leading-none' : 'text-2xl font-bold text-gray-900'">
          {{ count }}<span :class="compact ? 'text-xs font-normal text-gray-400' : 'text-sm font-normal text-gray-400'">/{{ total }}</span>
        </div>
        <div :class="compact ? 'mt-2 h-1 bg-gray-100 rounded-full overflow-hidden' : 'mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden'">
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${(count / total) * 100}%`, background: color }"
          />
        </div>
      </template>
    </div>
  </div>
</template>
