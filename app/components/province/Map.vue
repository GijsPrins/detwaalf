<script setup lang="ts">
import map from '@svg-maps/netherlands'

type Distance = '10k' | 'half' | 'marathon'
type ActiveDistance = 'all' | Distance

const props = defineProps<{
  completedProvinces: Partial<Record<Distance, Set<number>>>
  upcomingProvinces: Partial<Record<Distance, Set<number>>>
  activeDistance: ActiveDistance
  selectedProvinceId: number | null
}>()

const emit = defineEmits<{
  'update:selectedProvinceId': [id: number | null]
}>()

const hovered = ref<string | null>(null)

const SLUG_TO_ID: Record<string, number> = {
  gr: 1, fr: 2, dr: 3, ov: 4, fl: 5, ge: 6,
  ut: 7, nh: 8, zh: 9, ze: 10, nb: 11, li: 12,
}

const COLORS: Record<Distance, string> = {
  '10k': '#cd7f32',
  half: '#9ca3af',
  marathon: '#eab308',
}

const selectedPath = computed(() => {
  if (!props.selectedProvinceId) return null
  const entry = Object.entries(SLUG_TO_ID).find(([, id]) => id === props.selectedProvinceId)
  if (!entry) return null
  return map.locations.find(l => l.id === entry[0])?.path ?? null
})

function toggleProvince(slug: string) {
  const id = SLUG_TO_ID[slug]
  emit('update:selectedProvinceId', props.selectedProvinceId === id ? null : id)
}

function fillColor(slug: string): string {
  const id = SLUG_TO_ID[slug]
  const { completedProvinces, upcomingProvinces, activeDistance } = props

  if (activeDistance !== 'all') {
    if (completedProvinces[activeDistance]?.has(id)) return COLORS[activeDistance]
    if (upcomingProvinces[activeDistance]?.has(id)) return `url(#stripe-${activeDistance})`
    return '#e5e7eb'
  }

  if (completedProvinces.marathon?.has(id)) return COLORS.marathon
  if (completedProvinces.half?.has(id)) return COLORS.half
  if (completedProvinces['10k']?.has(id)) return COLORS['10k']
  if (upcomingProvinces.marathon?.has(id)) return 'url(#stripe-marathon)'
  if (upcomingProvinces.half?.has(id)) return 'url(#stripe-half)'
  if (upcomingProvinces['10k']?.has(id)) return 'url(#stripe-10k)'
  return '#e5e7eb'
}
</script>

<template>
  <div class="w-full flex justify-center">
    <svg :viewBox="map.viewBox" class="w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="stripe-10k" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#f5e6d3" />
          <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#cd7f32" stroke-width="2.5" stroke-linecap="square" />
        </pattern>
        <pattern id="stripe-half" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#f3f4f6" />
          <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="square" />
        </pattern>
        <pattern id="stripe-marathon" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#fef9c3" />
          <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#ca8a04" stroke-width="2.5" stroke-linecap="square" />
        </pattern>
      </defs>

      <g v-for="province in map.locations" :key="province.id">
        <path
          :d="province.path"
          :fill="fillColor(province.id)"
          stroke="white"
          stroke-width="2"
          stroke-linejoin="round"
          class="cursor-pointer hover:opacity-80 transition-opacity"
          @mouseenter="hovered = province.name"
          @mouseleave="hovered = null"
          @click="toggleProvince(province.id)"
        />
      </g>

      <path
        v-if="selectedPath"
        :d="selectedPath"
        fill="none"
        stroke="#fb923c"
        stroke-width="3"
        stroke-linejoin="round"
        pointer-events="none"
      />

      <text
        v-if="hovered"
        x="306"
        y="710"
        text-anchor="middle"
        font-size="16"
        fill="#6b7280"
      >
        {{ hovered }}
      </text>
    </svg>
  </div>
</template>
