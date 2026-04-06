<script setup lang="ts">
import map from '@svg-maps/netherlands'
import { SLUG_TO_ID } from '~/constants/provinces'

const props = defineProps<{
  provinceId: number
}>()

const pathRef = ref<SVGPathElement | null>(null)
const viewBox = ref('0 0 100 100')

const provincePath = computed(() => {
  const slug = Object.entries(SLUG_TO_ID).find(([, id]) => id === props.provinceId)?.[0]
  if (!slug) return null
  return map.locations.find(l => l.id === slug)?.path ?? null
})

onMounted(() => {
  if (pathRef.value) {
    const { x, y, width, height } = pathRef.value.getBBox()
    const padding = 12
    viewBox.value = `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`
  }
})
</script>

<template>
  <svg
    v-if="provincePath"
    :viewBox="viewBox"
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-full"
  >
    <path
      ref="pathRef"
      :d="provincePath"
      fill="#fed7aa"
      stroke="white"
      stroke-width="3"
      stroke-linejoin="round"
    />
  </svg>
</template>
