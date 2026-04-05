<script setup lang="ts">
import type { Enums } from "~/types/database.types";
import {
  type DistanceCategory,
  type ActiveDistance,
  DISTANCE_COLORS,
  DISTANCE_BADGE_CLASS,
} from "~/constants/distances";
import { PROVINCE_COUNT } from "~/constants/provinces";

const { t } = useI18n();
useHead(() => ({ title: t("page.dashboard") }));

type ParticipationStatus = Enums<"participation_status">;

const activeDistance = ref<ActiveDistance>("all");
const selectedProvinceId = ref<number | null>(null);

// --- Placeholder data (replace with real composables later) ---

const completedProvinces: Record<DistanceCategory, Set<number>> = {
  "10k": new Set([2, 7, 9, 11]), // fr, ut, zh, nb
  half: new Set([6, 4]), // ge, ov
  marathon: new Set([8, 12]), // nh, li
};

const upcomingProvinces: Record<DistanceCategory, Set<number>> = {
  "10k": new Set(),
  half: new Set([12, 7, 2]), // li, ut, fr
  marathon: new Set(),
};

interface UpcomingEvent {
  name: string;
  province: string;
  distance: string;
  date: string;
  status: ParticipationStatus;
}

const upcomingEvents: UpcomingEvent[] = [
  {
    name: "dsm-firmenich Maastricht Marathon",
    province: "Limburg",
    distance: "Halve marathon",
    date: "24 mei",
    status: "signed_up",
  },
  {
    name: "Marathon Amersfoort",
    province: "Utrecht",
    distance: "Halve marathon",
    date: "31 mei",
    status: "signed_up",
  },
  {
    name: "Halve Marathon Vlieland",
    province: "Friesland",
    distance: "Halve marathon",
    date: "9 aug",
    status: "signed_up",
  },
];

// --- Derived ---

interface MedalTrack {
  key: DistanceCategory;
  label: string;
  medal: string;
  count: number;
  color: string;
  badgeClass: string;
}

const medalTracks = computed<MedalTrack[]>(() => [
  {
    key: "10k",
    label: t("dashboard.filters.10k"),
    medal: t("dashboard.medals.10k"),
    count: completedProvinces["10k"].size,
    color: DISTANCE_COLORS["10k"],
    badgeClass: DISTANCE_BADGE_CLASS["10k"],
  },
  {
    key: "half",
    label: t("dashboard.filters.half"),
    medal: t("dashboard.medals.half"),
    count: completedProvinces.half.size,
    color: DISTANCE_COLORS.half,
    badgeClass: DISTANCE_BADGE_CLASS.half,
  },
  {
    key: "marathon",
    label: t("dashboard.filters.marathon"),
    medal: t("dashboard.medals.marathon"),
    count: completedProvinces.marathon.size,
    color: DISTANCE_COLORS.marathon,
    badgeClass: DISTANCE_BADGE_CLASS.marathon,
  },
]);

const filters = computed(() => [
  { key: "all" as const, label: t("dashboard.filters.all") },
  { key: "10k" as const, label: t("dashboard.filters.10k") },
  { key: "half" as const, label: t("dashboard.filters.half") },
  { key: "marathon" as const, label: t("dashboard.filters.marathon") },
]);
</script>

<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5">
      <!-- Map -->
      <div class="bg-white rounded-xl border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-5">
          <span class="text-sm font-medium text-gray-900">{{
            t("dashboard.provincesLabel")
          }}</span>
          <div class="flex items-center gap-1">
            <button
              v-for="filter in filters"
              :key="filter.key"
              class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
              :class="
                activeDistance === filter.key
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-500 hover:text-gray-900'
              "
              @click="activeDistance = filter.key"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
        <ProvinceMap
          :completed-provinces="completedProvinces"
          :upcoming-provinces="upcomingProvinces"
          :active-distance="activeDistance"
          :selected-province-id="selectedProvinceId"
          @update:selected-province-id="selectedProvinceId = $event"
        />
      </div>

      <!-- Right column -->
      <div class="flex flex-col gap-4">
        <!-- Medal progress cards -->
        <div
          v-for="track in medalTracks"
          :key="track.key"
          class="bg-white rounded-xl border border-gray-100 p-5"
        >
          <div class="flex items-start justify-between mb-2">
            <span class="text-sm text-gray-700">{{ track.label }}</span>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="track.badgeClass"
            >
              {{ track.medal }}
            </span>
          </div>
          <div class="text-2xl font-bold text-gray-900">
            {{ track.count
            }}<span class="text-sm font-normal text-gray-400"
              >/{{ PROVINCE_COUNT }}</span
            >
          </div>
          <div class="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :style="{
                width: `${(track.count / PROVINCE_COUNT) * 100}%`,
                background: track.color,
              }"
            />
          </div>
        </div>

        <!-- Upcoming events -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">
            {{ t("dashboard.upcoming") }}
          </h3>
          <div class="flex flex-col divide-y divide-gray-50">
            <div
              v-for="event in upcomingEvents"
              :key="event.name"
              class="flex items-start justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ event.name }}
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ event.province }} · {{ event.distance }}
                </p>
              </div>
              <div class="text-right ml-4 shrink-0">
                <p class="text-xs text-gray-400">{{ event.date }}</p>
                <p class="text-xs font-medium text-orange-600 mt-0.5">
                  {{ t(`dashboard.statuses.${event.status}`) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
