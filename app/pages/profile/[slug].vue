<script setup lang="ts">
import {
  type DistanceCategory,
  type ActiveDistance,
  DISTANCE_COLORS,
  DISTANCE_BADGE_CLASS,
} from '~/constants/distances'
import { PROVINCE_COUNT, PROVINCE_NAMES } from '~/constants/provinces'
import type { PublicParticipationRow, ProfileWithSlug } from '~/queries/profiles'

const { t } = useI18n()
const route = useRoute()
const slug = computed(() => route.params.slug as string)

const { profile, participations, completedProvinces, isLoading, notFound, isPrivate } =
  usePublicProfile(slug)

useHead(() => ({
  title: profile.value?.display_name ?? t('page.publicProfile'),
}))

const activeDistance = ref<ActiveDistance>('all')
const selectedProvinceId = ref<number | null>(null)

const selectedProvinceName = computed(() =>
  selectedProvinceId.value != null
    ? (PROVINCE_NAMES[selectedProvinceId.value] ?? null)
    : null,
)

function distanceCategory(km: number): DistanceCategory {
  if (km >= 42.195) return 'marathon'
  if (km >= 21.097) return 'half'
  return '10k'
}

function formatEventDate(dateStr: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

interface ProvinceEventInfo {
  eventName: string
  eventDate: string
}

const selectedProvinceEvents = computed<Record<DistanceCategory, ProvinceEventInfo | null>>(() => {
  const result: Record<DistanceCategory, ProvinceEventInfo | null> = {
    '10k': null,
    half: null,
    marathon: null,
  }
  if (selectedProvinceId.value == null) return result

  for (const p of participations.value ?? []) {
    if (p.province_id !== selectedProvinceId.value) continue
    const cat = distanceCategory(p.actual_distance_km)
    const existing = result[cat]
    if (!existing || p.event_date > existing.eventDate) {
      result[cat] = {
        eventName: p.event_name,
        eventDate: formatEventDate(p.event_date),
      }
    }
  }
  return result
})

const medalTracks = computed(() => [
  {
    key: '10k' as DistanceCategory,
    label: t('dashboard.filters.10k'),
    medal: t('dashboard.medals.10k'),
    count: completedProvinces.value['10k'].size,
    color: DISTANCE_COLORS['10k'],
    badgeClass: DISTANCE_BADGE_CLASS['10k'],
  },
  {
    key: 'half' as DistanceCategory,
    label: t('dashboard.filters.half'),
    medal: t('dashboard.medals.half'),
    count: completedProvinces.value.half.size,
    color: DISTANCE_COLORS.half,
    badgeClass: DISTANCE_BADGE_CLASS.half,
  },
  {
    key: 'marathon' as DistanceCategory,
    label: t('dashboard.filters.marathon'),
    medal: t('dashboard.medals.marathon'),
    count: completedProvinces.value.marathon.size,
    color: DISTANCE_COLORS.marathon,
    badgeClass: DISTANCE_BADGE_CLASS.marathon,
  },
])

const filters = computed(() => [
  {
    key: 'all' as const,
    label: t('dashboard.filters.all'),
    activeClass: 'bg-orange-100 text-orange-700',
    inactiveClass: 'text-gray-500 hover:text-gray-900',
  },
  {
    key: '10k' as const,
    label: t('dashboard.medals.10k'),
    activeClass: 'bg-orange-200 text-orange-800',
    inactiveClass: 'text-orange-400 hover:text-orange-600',
  },
  {
    key: 'half' as const,
    label: t('dashboard.medals.half'),
    activeClass: 'bg-gray-200 text-gray-700',
    inactiveClass: 'text-gray-400 hover:text-gray-600',
  },
  {
    key: 'marathon' as const,
    label: t('dashboard.medals.marathon'),
    activeClass: 'bg-yellow-100 text-yellow-700',
    inactiveClass: 'text-yellow-500 hover:text-yellow-700',
  },
])

const profileWithSlug = computed(() => profile.value as ProfileWithSlug | null)

const avatarInitials = computed(() => {
  const name = profileWithSlug.value?.display_name ?? ''
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'
})

const emptyProvinces = computed<Record<DistanceCategory, Set<number>>>(() => ({
  '10k': new Set(),
  half: new Set(),
  marathon: new Set(),
}))
</script>

<template>
  <div class="page-list-container">
    <!-- Loading -->
    <div v-if="isLoading" class="text-sm text-gray-400 py-8 text-center">
      {{ t('profile.loading') }}
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="text-sm text-gray-400 py-8 text-center">
      {{ t('publicProfile.notFound') }}
    </div>

    <!-- Private profile -->
    <div v-else-if="isPrivate" class="py-8 text-center">
      <p class="text-sm text-gray-400">{{ t('publicProfile.isPrivate') }}</p>
    </div>

    <!-- Public profile -->
    <template v-else-if="profile">
      <!-- Profile header -->
      <div class="flex items-center gap-4 mb-8">
        <div
          class="flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 shrink-0"
        >
          <span class="text-white text-xl font-bold">{{ avatarInitials }}</span>
        </div>
        <div>
          <p class="text-lg font-semibold text-gray-900">
            {{ profileWithSlug?.display_name || '—' }}
          </p>
          <p v-if="profileWithSlug?.slug" class="text-xs text-gray-400">
            @{{ profileWithSlug.slug }}
          </p>
        </div>
      </div>

      <!-- Compact mobile medal summary -->
      <div class="grid grid-cols-3 gap-3 mb-4 lg:hidden">
        <DashboardMedalCard
          v-for="track in medalTracks"
          :key="track.key"
          :medal="track.medal"
          :label="track.label"
          :count="track.count"
          :total="PROVINCE_COUNT"
          :color="track.color"
          :badge-class="track.badgeClass"
          :province-selected="selectedProvinceId != null"
          :event-id="null"
          :event-name="selectedProvinceEvents[track.key]?.eventName ?? null"
          :event-date="selectedProvinceEvents[track.key]?.eventDate ?? null"
          :finish-time="null"
          compact
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5">
        <!-- Map -->
        <div class="bg-white rounded-xl border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-5">
            <span class="text-sm font-medium text-gray-900">{{
              t('dashboard.provincesLabel')
            }}</span>
            <div class="flex items-center gap-1">
              <button
                v-for="filter in filters"
                :key="filter.key"
                class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                :class="
                  activeDistance === filter.key
                    ? filter.activeClass
                    : filter.inactiveClass
                "
                @click="activeDistance = filter.key"
              >
                {{ filter.label }}
              </button>
            </div>
          </div>
          <ProvinceMap
            :completed-provinces="completedProvinces"
            :upcoming-provinces="emptyProvinces"
            :active-distance="activeDistance"
            :selected-province-id="selectedProvinceId"
            @update:selected-province-id="selectedProvinceId = $event"
          />
        </div>

        <!-- Right column -->
        <div class="flex flex-col gap-4">
          <div class="h-6 flex items-center px-1">
            <span
              v-if="selectedProvinceName"
              class="text-sm font-medium text-gray-700"
            >
              {{ selectedProvinceName }}
            </span>
            <span v-else class="text-xs text-gray-400">
              {{ t('dashboard.selectProvinceHint') }}
            </span>
          </div>

          <DashboardMedalCard
            v-for="track in medalTracks"
            :key="track.key"
            class="hidden lg:block"
            :medal="track.medal"
            :label="track.label"
            :count="track.count"
            :total="PROVINCE_COUNT"
            :color="track.color"
            :badge-class="track.badgeClass"
            :province-selected="selectedProvinceId != null"
            :event-id="null"
            :event-name="selectedProvinceEvents[track.key]?.eventName ?? null"
            :event-date="selectedProvinceEvents[track.key]?.eventDate ?? null"
            :finish-time="null"
          />
        </div>
      </div>
    </template>
  </div>
</template>
