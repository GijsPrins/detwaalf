<script setup lang="ts">
import type { Enums } from "~/types/database.types";
import {
  type DistanceCategory,
  type ActiveDistance,
  DISTANCE_COLORS,
  DISTANCE_BADGE_CLASS,
} from "~/constants/distances";
import { PROVINCE_COUNT } from "~/constants/provinces";
import type { CompleteModalEvent, CompleteModalResult } from "~/components/participation/CompleteModal.vue";

const { t } = useI18n();
useHead(() => ({ title: t("page.dashboard") }));

type ParticipationStatus = Enums<"participation_status">;

const activeDistance = ref<ActiveDistance>("all");
const selectedProvinceId = ref<number | null>(null);

const { data: events } = useEventList();
const { data: participations } = useParticipations();

const today = new Date().toISOString().slice(0, 10);

const eventMap = computed(() => {
  const map = new Map<string, NonNullable<typeof events.value>[number]>();
  (events.value ?? []).forEach((e) => map.set(e.id, e));
  return map;
});

// When event_distance_id is null, fall back to the event's distances.
// Only resolves a category if all distances on the event share one category.
function inferCategory(event: NonNullable<typeof events.value>[number]): DistanceCategory | null {
  const cats = new Set(event.event_distances.map((d) => d.distance_category));
  return cats.size === 1 ? ([...cats][0] as DistanceCategory) : null;
}

const completedProvinces = computed<Record<DistanceCategory, Set<number>>>(
  () => {
    const result: Record<DistanceCategory, Set<number>> = {
      "10k": new Set(),
      half: new Set(),
      marathon: new Set(),
    };
    for (const p of participations.value ?? []) {
      if (p.status !== "completed") continue;
      const event = eventMap.value.get(p.event_id);
      if (!event) continue;
      const category =
        p.event_distance?.distance_category ?? inferCategory(event);
      if (!category) continue;
      result[category].add(event.province_id);
    }
    return result;
  },
);

const upcomingProvinces = computed<Record<DistanceCategory, Set<number>>>(
  () => {
    const result: Record<DistanceCategory, Set<number>> = {
      "10k": new Set(),
      half: new Set(),
      marathon: new Set(),
    };
    for (const p of participations.value ?? []) {
      if (p.status !== "interested" && p.status !== "signed_up") continue;
      const event = eventMap.value.get(p.event_id);
      if (!event || event.event_date < today) continue;
      const category =
        p.event_distance?.distance_category ?? inferCategory(event);
      if (!category) continue;
      result[category].add(event.province_id);
    }
    return result;
  },
);

interface UpcomingEvent {
  id: string;
  eventId: string;
  name: string;
  province: string;
  provinceId: number;
  distance: string;
  sortDate: string;
  date: string;
  status: ParticipationStatus;
}

interface ProvinceEventInfo {
  eventId: string;
  eventName: string;
  sortDate: string;
  date: string;
  finishTimeSeconds: number | null;
}

function formatFinishTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function formatEventDate(dateStr: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
  }).format(new Date(dateStr));
}

const upcomingEvents = computed<UpcomingEvent[]>(() => {
  const result: UpcomingEvent[] = [];
  for (const p of participations.value ?? []) {
    if (p.status !== "interested" && p.status !== "signed_up") continue;
    const event = eventMap.value.get(p.event_id);
    if (!event?.event_date || event.event_date < today) continue;
    result.push({
      id: p.id,
      eventId: p.event_id,
      name: event.name,
      province: event.province?.name ?? "",
      provinceId: event.province_id,
      distance: p.event_distance
        ? t(`eventDistance.${p.event_distance.distance}`)
        : "",
      sortDate: event.event_date,
      date: formatEventDate(event.event_date),
      status: p.status,
    });
  }
  return result.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
});

const visibleUpcomingEvents = computed(() => {
  if (selectedProvinceId.value != null) {
    return upcomingEvents.value.filter(
      (e) => e.provinceId === selectedProvinceId.value,
    );
  }
  return upcomingEvents.value.slice(0, 3);
});

const provinceNameMap = computed(() => {
  const map = new Map<number, string>();
  for (const event of events.value ?? []) {
    if (event.province?.name) map.set(event.province_id, event.province.name);
  }
  return map;
});

const selectedProvinceName = computed(() =>
  selectedProvinceId.value != null
    ? (provinceNameMap.value.get(selectedProvinceId.value) ?? null)
    : null,
);

const selectedProvinceEvents = computed<
  Record<DistanceCategory, ProvinceEventInfo | null>
>(() => {
  const result: Record<DistanceCategory, ProvinceEventInfo | null> = {
    "10k": null,
    half: null,
    marathon: null,
  };
  if (selectedProvinceId.value == null) return result;

  for (const p of participations.value ?? []) {
    if (p.status !== "completed") continue;
    const event = eventMap.value.get(p.event_id);
    if (!event || event.province_id !== selectedProvinceId.value) continue;
    const category =
      p.event_distance?.distance_category ?? inferCategory(event);
    if (!category) continue;
    const existing = result[category];
    if (!existing || event.event_date > existing.sortDate) {
      result[category] = {
        eventId: event.id,
        eventName: event.name,
        sortDate: event.event_date,
        date: formatEventDate(event.event_date),
        finishTimeSeconds: p.finish_time_seconds ?? null,
      };
    }
  }
  return result;
});

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
    count: completedProvinces.value["10k"].size,
    color: DISTANCE_COLORS["10k"],
    badgeClass: DISTANCE_BADGE_CLASS["10k"],
  },
  {
    key: "half",
    label: t("dashboard.filters.half"),
    medal: t("dashboard.medals.half"),
    count: completedProvinces.value.half.size,
    color: DISTANCE_COLORS.half,
    badgeClass: DISTANCE_BADGE_CLASS.half,
  },
  {
    key: "marathon",
    label: t("dashboard.filters.marathon"),
    medal: t("dashboard.medals.marathon"),
    count: completedProvinces.value.marathon.size,
    color: DISTANCE_COLORS.marathon,
    badgeClass: DISTANCE_BADGE_CLASS.marathon,
  },
]);

const filters = computed(() => [
  { key: "all" as const, label: t("dashboard.filters.all"), activeClass: "bg-orange-100 text-orange-700", inactiveClass: "text-gray-500 hover:text-gray-900" },
  { key: "10k" as const, label: t("dashboard.medals.10k"), activeClass: "bg-orange-200 text-orange-800", inactiveClass: "text-orange-400 hover:text-orange-600" },
  { key: "half" as const, label: t("dashboard.medals.half"), activeClass: "bg-gray-200 text-gray-700", inactiveClass: "text-gray-400 hover:text-gray-600" },
  { key: "marathon" as const, label: t("dashboard.medals.marathon"), activeClass: "bg-yellow-100 text-yellow-700", inactiveClass: "text-yellow-500 hover:text-yellow-700" },
]);

// ---- Complete-a-run flow ----

interface PendingEvent {
  participationId: string;
  eventId: string;
  eventDistanceId: string | null;
  eventName: string;
  province: string;
  provinceId: number;
  distance: string;
  distanceCategory: DistanceCategory | null;
  eventDate: string;
  sortDate: string;
}

const pendingEvents = computed<PendingEvent[]>(() => {
  const result: PendingEvent[] = [];
  for (const p of participations.value ?? []) {
    if (p.status !== "interested" && p.status !== "signed_up") continue;
    const event = eventMap.value.get(p.event_id);
    if (!event || event.event_date > today) continue;
    result.push({
      participationId: p.id,
      eventId: p.event_id,
      eventDistanceId: p.event_distance_id ?? null,
      eventName: event.name,
      province: event.province?.name ?? "",
      provinceId: event.province_id,
      distance: p.event_distance
        ? t(`eventDistance.${p.event_distance.distance}`)
        : "",
      distanceCategory:
        p.event_distance?.distance_category ?? inferCategory(event),
      eventDate: formatEventDate(event.event_date),
      sortDate: event.event_date,
    });
  }
  return result.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
});

const modalEvent = ref<CompleteModalEvent | null>(null);
const celebrationMedal = ref<DistanceCategory | null>(null);
const celebrationProvince = ref("");

function openModal(eventId: string) {
  const pending = pendingEvents.value.find((e) => e.eventId === eventId);
  if (!pending) return;
  modalEvent.value = {
    eventId: pending.eventId,
    eventDistanceId: pending.eventDistanceId,
    eventName: pending.eventName,
    province: pending.province,
    distance: pending.distance,
  };
}

const { mutateAsync: completeParticipation } = useCompleteParticipation();

async function handleConfirm(result: CompleteModalResult) {
  if (!modalEvent.value) return;
  const pending = pendingEvents.value.find(
    (e) => e.eventId === modalEvent.value!.eventId,
  );

  const isNewMedal =
    result.status === "completed" &&
    pending?.distanceCategory != null &&
    !completedProvinces.value[pending.distanceCategory].has(
      pending.provinceId,
    );

  await completeParticipation({
    eventId: modalEvent.value.eventId,
    eventDistanceId: modalEvent.value.eventDistanceId,
    status: result.status,
    finishTimeSeconds: result.finishTimeSeconds,
    timingUrl: result.timingUrl,
    notes: result.notes,
  });

  modalEvent.value = null;

  if (isNewMedal && pending?.distanceCategory) {
    celebrationMedal.value = pending.distanceCategory;
    celebrationProvince.value = pending.province;
  }
}
</script>

<template>
  <div>
    <ParticipationCompletePrompt
      :events="pendingEvents"
      @complete="openModal"
    />

    <!-- Compact mobile medal summary (always visible on mobile) -->
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
        :event-id="selectedProvinceEvents[track.key]?.eventId ?? null"
        :event-name="selectedProvinceEvents[track.key]?.eventName ?? null"
        :event-date="selectedProvinceEvents[track.key]?.date ?? null"
        :finish-time="selectedProvinceEvents[track.key]?.finishTimeSeconds != null ? formatFinishTime(selectedProvinceEvents[track.key]!.finishTimeSeconds!) : null"
        compact
      />
    </div>

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
              :class="activeDistance === filter.key ? filter.activeClass : filter.inactiveClass"
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
        <!-- Province context label — always rendered to reserve height -->
        <div class="h-6 flex items-center px-1">
          <span v-if="selectedProvinceName" class="text-sm font-medium text-gray-700">
            {{ selectedProvinceName }}
          </span>
          <span v-else class="text-xs text-gray-400">
            {{ t("dashboard.selectProvinceHint") }}
          </span>
        </div>

        <!-- Medal progress cards (desktop only) -->
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
          :event-id="selectedProvinceEvents[track.key]?.eventId ?? null"
          :event-name="selectedProvinceEvents[track.key]?.eventName ?? null"
          :event-date="selectedProvinceEvents[track.key]?.date ?? null"
          :finish-time="selectedProvinceEvents[track.key]?.finishTimeSeconds != null ? formatFinishTime(selectedProvinceEvents[track.key]!.finishTimeSeconds!) : null"
        />

        <!-- Upcoming events -->
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-900 mb-4">
            {{ t("dashboard.upcoming") }}
          </h3>
          <p
            v-if="visibleUpcomingEvents.length === 0"
            class="text-sm text-gray-400"
          >
            {{ t("dashboard.noUpcoming") }}
          </p>
          <div v-else class="flex flex-col divide-y divide-gray-50">
            <NuxtLink
              v-for="event in visibleUpcomingEvents"
              :key="event.id"
              :to="`/events/${event.eventId}`"
              class="flex items-start justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ event.name }}
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ event.province
                  }}<template v-if="event.distance">
                    · {{ event.distance }}</template
                  >
                </p>
              </div>
              <div class="text-right ml-4 shrink-0">
                <p class="text-xs text-gray-400">{{ event.date }}</p>
                <p class="text-xs font-medium text-orange-600 mt-0.5">
                  {{ t(`dashboard.statuses.${event.status}`) }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <ParticipationCompleteModal
      :event="modalEvent"
      @confirm="handleConfirm"
      @cancel="modalEvent = null"
    />

    <ParticipationMedalCelebration
      v-if="celebrationMedal"
      :medal="celebrationMedal"
      :province="celebrationProvince"
      @close="celebrationMedal = null"
    />
  </div>
</template>
