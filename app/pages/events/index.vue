<script setup lang="ts">
import type { Enums } from "~/types/database.types";
import { PARTICIPATION_STATUS_BADGE_CLASS } from "~/constants/participation";
import { mapEvents } from "~/mappers/events";
import EventCardRow from "~/components/event/EventCardRow.vue";

definePageMeta({ auth: false });

const { t } = useI18n();
useHead(() => ({ title: t("nav.events") }));

const user = useSupabaseUser();
const { data: rawEvents, isPending: isEventsPending } = useEventList();
const { data: participations, isPending: isPartPending } = useParticipations();
const { data: provinces } = useProvinces();

const isPending = computed(
  () => isEventsPending.value || (!!user.value && isPartPending.value),
);
const events = computed(() =>
  mapEvents(rawEvents.value ?? [], participations.value ?? []),
);

type StatusFilter = "all" | Enums<"participation_status">;
type Tab = "catalog" | "participations";

const statusFilter = ref<StatusFilter>("all");
const activeTab = ref<Tab>("catalog");
const provinceFilter = ref<number | null>(null);
const sortBy = ref<"date" | "name">("date");
const showPastArchive = ref(false);

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: t("events.statusFilter.all") },
  { key: "interested", label: t("events.statusFilter.interested") },
  { key: "signed_up", label: t("events.statusFilter.signed_up") },
  { key: "completed", label: t("events.statusFilter.completed") },
  { key: "dns", label: t("events.statusFilter.dns") },
  { key: "dnf", label: t("events.statusFilter.dnf") },
];

const todayStr = new Date().toISOString().split("T")[0];

const filteredEvents = computed(() => {
  let list = events.value ?? [];

  if (activeTab.value === "participations") {
    list = list.filter((e) => e.participationStatus);
    if (statusFilter.value !== "all") {
      list = list.filter((e) => e.participationStatus === statusFilter.value);
    }
  }

  if (provinceFilter.value !== null) {
    list = list.filter((e) => e.provinceId === provinceFilter.value);
  }

  if (sortBy.value === "name") {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, "nl"));
  } else {
    // Chronological flowing. But specifically reverse the flow for 'Trophy Case' / completed events so newest medals are at the top.
    list = [...list].sort((a, b) => {
      if (
        activeTab.value === "participations" &&
        statusFilter.value === "completed"
      ) {
        return b.eventDate.localeCompare(a.eventDate);
      }
      return a.eventDate.localeCompare(b.eventDate);
    });
  }

  return list;
});

function groupEventList(list: typeof filteredEvents.value) {
  const groups: { label: string; events: typeof list }[] = [];

  if (sortBy.value === "date") {
    const map = new Map<string, typeof list>();
    for (const e of list) {
      const date = new Date(e.eventDate);
      const label = date.toLocaleDateString("nl-NL", {
        month: "long",
        year: "numeric",
      });
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

      if (!map.has(capitalizedLabel)) map.set(capitalizedLabel, []);
      map.get(capitalizedLabel)!.push(e);
    }
    for (const [label, evts] of map.entries()) {
      groups.push({ label, events: evts });
    }
  } else {
    const map = new Map<string, typeof list>();
    for (const e of list) {
      const label = e.provinceName;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(e);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) =>
      a.localeCompare(b, "nl"),
    );
    for (const label of sortedKeys) {
      groups.push({ label, events: map.get(label)! });
    }
  }

  return groups;
}

const upcomingGroups = computed(() =>
  groupEventList(filteredEvents.value.filter((e) => e.eventDate >= todayStr)),
);
const pastEvents = computed(() =>
  filteredEvents.value.filter((e) => e.eventDate < todayStr),
);
const pastGroups = computed(() => groupEventList(pastEvents.value));
</script>

<template>
  <div class="page-list-container">
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
          {{ t("events.title") }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ t("events.subtitle") }}
        </p>
      </div>

      <!-- CTA only on catalog tab -->
      <NuxtLink
        v-if="user && activeTab === 'catalog'"
        to="/events/new"
        class="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        + {{ t("events.new") }}
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <div
      class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-max mb-6"
      v-if="user"
    >
      <button
        class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="
          activeTab === 'catalog'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="
          activeTab = 'catalog';
          statusFilter = 'all';
          showPastArchive = false;
        "
      >
        {{ t("events.tabs.catalog") }}
      </button>
      <button
        class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="
          activeTab === 'participations'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="activeTab = 'participations'"
      >
        {{ t("events.tabs.participations") }}
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <!-- Status pills (only when logged in AND on participations tab) -->
      <div
        v-if="user && activeTab === 'participations'"
        class="flex items-center gap-1"
      >
        <button
          v-for="filter in statusFilters"
          :key="filter.key"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
          :class="
            statusFilter === filter.key
              ? 'bg-orange-100 text-orange-700'
              : 'text-gray-500 hover:text-gray-900'
          "
          @click="statusFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Padding spacer if status filters are hidden -->
      <div
        class="flex flex-wrap items-center gap-2 w-full"
        :class="
          user && activeTab === 'participations'
            ? 'sm:w-auto ml-auto'
            : 'w-full'
        "
      >
        <!-- Province filter -->
        <select
          v-model="provinceFilter"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 bg-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          <option :value="null">{{ t("events.filter.allProvinces") }}</option>
          <option
            v-for="province in provinces"
            :key="province.id"
            :value="province.id"
          >
            {{ province.name }}
          </option>
        </select>

        <!-- Sort -->
        <select
          v-model="sortBy"
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 bg-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        >
          <option value="date">{{ t("events.sort.date") }}</option>
          <option value="name">{{ t("events.sort.name") }}</option>
        </select>
      </div>
    </div>

    <!-- Empty States -->
    <div v-if="isPending" class="text-sm text-gray-400 py-12 text-center">
      &hellip;
    </div>

    <div
      v-else-if="filteredEvents.length === 0"
      class="text-sm text-gray-400 py-12 text-center"
    >
      {{ t("events.empty") }}
    </div>

    <!-- List -->
    <div v-else class="space-y-10">
      <!-- Upcoming Events (Primary View) -->
      <div v-for="group in upcomingGroups" :key="group.label">
        <h2
          class="text-sm font-semibold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10 border-b border-gray-200"
        >
          {{ group.label }}
        </h2>
        <div class="space-y-3">
          <EventCardRow
            v-for="event in group.events"
            :key="event.id"
            :event="event"
          />
        </div>
      </div>

      <!-- Past Events Archive Toggle (Only visible if there are past events) -->
      <div
        v-if="pastEvents.length > 0"
        class="mt-12 text-center border-t border-gray-100 pt-8"
      >
        <button
          v-if="!showPastArchive"
          @click="showPastArchive = true"
          class="text-sm text-gray-500 hover:text-orange-600 font-medium transition-colors"
        >
          {{ t("events.archive.show", { count: pastEvents.length }) }}
        </button>

        <div v-else class="text-left mt-8 space-y-10">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ t("events.archive.title", { count: pastEvents.length }) }}
            </h3>
            <button
              @click="showPastArchive = false"
              class="text-xs text-gray-500 hover:text-gray-900"
            >
              {{ t("events.archive.hide") }}
            </button>
          </div>

          <div v-for="group in pastGroups" :key="group.label">
            <h2
              class="text-sm font-semibold text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10 border-b border-gray-200"
            >
              {{ group.label }}
            </h2>
            <div class="space-y-3">
              <EventCardRow
                v-for="event in group.events"
                :key="event.id"
                :event="event"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
