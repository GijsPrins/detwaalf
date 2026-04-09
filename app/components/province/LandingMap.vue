<script setup lang="ts">
import map from "@svg-maps/netherlands";
import { SLUG_TO_ID } from "~/constants/provinces";
import { DISTANCE_COLORS, type DistanceCategory } from "~/constants/distances";

const MEDALS: DistanceCategory[] = ["10k", "half", "marathon"];
const GRAY = "#e5e7eb";

const slugs = map.locations.map((l) => l.id);

// Seed with ~4 random provinces already colored so the map isn't bare on load
const initialColors = Object.fromEntries(slugs.map((slug) => [slug, GRAY]));
const seedCount = 4;
const seedIndices = [...slugs]
  .sort(() => Math.random() - 0.5)
  .slice(0, seedCount);
for (const slug of seedIndices) {
  initialColors[slug] =
    DISTANCE_COLORS[MEDALS[Math.floor(Math.random() * MEDALS.length)]];
}

const provinceColors = reactive<Record<string, string>>(initialColors);

let timer: ReturnType<typeof setTimeout> | null = null;

function scheduleNext() {
  // Vary delay between 1s and 4s for natural rhythm with implicit pauses
  const delay = 1000 + Math.random() * 3000;
  timer = setTimeout(() => {
    tick();
    scheduleNext();
  }, delay);
}

function tick() {
  // 20% chance of a no-op to add extra pause feel
  if (Math.random() < 0.2) return;

  const slug = slugs[Math.floor(Math.random() * slugs.length)];
  const current = provinceColors[slug];

  if (current === GRAY) {
    provinceColors[slug] =
      DISTANCE_COLORS[MEDALS[Math.floor(Math.random() * MEDALS.length)]];
  } else {
    // 30% uncolor, 70% switch to a different medal
    if (Math.random() < 0.3) {
      provinceColors[slug] = GRAY;
    } else {
      const currentMedal = MEDALS.find((m) => DISTANCE_COLORS[m] === current);
      const others = MEDALS.filter((m) => m !== currentMedal);
      provinceColors[slug] =
        DISTANCE_COLORS[others[Math.floor(Math.random() * others.length)]];
    }
  }
}

onMounted(() => scheduleNext());
onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <svg :viewBox="map.viewBox" xmlns="http://www.w3.org/2000/svg">
    <path
      v-for="province in map.locations"
      :key="province.id"
      :d="province.path"
      :fill="provinceColors[province.id]"
      stroke="white"
      stroke-width="2"
      stroke-linejoin="round"
      class="province-shape"
    />
  </svg>
</template>

<style scoped>
.province-shape {
  transition: fill 0.9s ease;
}
</style>
