<script setup lang="ts">
import type { Enums } from "~/types/database.types";
import { PARTICIPATION_STATUS_BADGE_CLASS } from "~/constants/participation";
import { mapEvents } from "~/mappers/events";
import { getLocalDateString } from "~/utils/localDate";
import EventCardRow from "~/components/event/EventCardRow.vue";

definePageMeta({ auth: false });

const { t } = useI18n();
useHead(() => ({ title: t("nav.events") }));

const user = useSupabaseUser();
const route = useRoute();
const router = useRouter();
const { data: rawEvents, isPending: isEventsPending } = useEventList();
const { data: participations, isPending: isPartPending } = useParticipations();
const { data: provinces } = useProvinces();

const isPending = computed(
  () => isEventsPending.value || (!!user.value && isPartPending.value),
);
const events = computed(() =>
  mapEvents(rawEvents.value ?? [], participations.value ?? []),
);
const participationCount = computed(
  () => events.value.filter((e) => e.participationStatus).length,
);

type StatusFilter = "all" | Enums<"participation_status">;
type Tab = "upcoming" | "past" | "participations";

function getTabFromRoute(): Tab {
  if (route.query.period === "past") return "past";
  if (route.query.tab === "participations" && user.value) {
    return "participations";
  }
  return "upcoming";
}

const statusFilter = ref<StatusFilter>("all");
const activeTab = ref<Tab>(getTabFromRoute());
const provinceFilter = ref<number | null>(null);
const sortBy = ref<"date" | "name">("date");

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: t("events.statusFilter.all") },
  { key: "interested", label: t("events.statusFilter.interested") },
  { key: "signed_up", label: t("events.statusFilter.signed_up") },
  { key: "completed", label: t("events.statusFilter.completed") },
  { key: "dns", label: t("events.statusFilter.dns") },
  { key: "dnf", label: t("events.statusFilter.dnf") },
];

const todayStr = getLocalDateString();

const tabEvents = computed(() => {
  let list = events.value ?? [];

  if (activeTab.value === "upcoming") {
    list = list.filter((e) => e.eventDate >= todayStr);
  }

  if (activeTab.value === "past") {
    list = list.filter((e) => e.eventDate < todayStr);
  }

  if (activeTab.value === "participations") {
    list = list.filter((e) => e.participationStatus);
  }

  return list;
});

const filteredEvents = computed(() => {
  let list = tabEvents.value;

  if (activeTab.value === "participations" && statusFilter.value !== "all") {
    list = list.filter((e) => e.participationStatus === statusFilter.value);
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
      if (activeTab.value === "past") {
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

const eventGroups = computed(() => groupEventList(filteredEvents.value));

const hasActiveFilters = computed(
  () =>
    provinceFilter.value !== null ||
    (activeTab.value === "participations" && statusFilter.value !== "all"),
);

const emptyState = computed(() => {
  if (hasActiveFilters.value && tabEvents.value.length > 0) {
    return {
      title: t("events.emptyState.filtered.title"),
      body: t("events.emptyState.filtered.body"),
      action: "clear" as const,
    };
  }

  if (activeTab.value === "upcoming") {
    return {
      title: t("events.emptyState.upcoming.title"),
      body: t("events.emptyState.upcoming.body"),
      action: "past" as const,
    };
  }

  if (activeTab.value === "past") {
    return {
      title: t("events.emptyState.past.title"),
      body: t("events.emptyState.past.body"),
      action: "upcoming" as const,
    };
  }

  return {
    title: t("events.emptyState.participations.title"),
    body: t("events.emptyState.participations.body"),
    action: "upcoming" as const,
  };
});

function setActiveTab(tab: Tab) {
  activeTab.value = tab;
  if (tab !== "participations") statusFilter.value = "all";

  router.replace({
    query: {
      ...route.query,
      period: tab === "past" ? "past" : undefined,
      tab: tab === "participations" ? "participations" : undefined,
    },
  });
}

function clearFilters() {
  provinceFilter.value = null;
  statusFilter.value = "all";
}

watch(
  () => [route.query.period, route.query.tab, user.value?.id],
  () => {
    activeTab.value = getTabFromRoute();
  },
);
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
        v-if="user && activeTab !== 'participations'"
        to="/events/new"
        class="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        + {{ t("events.new") }}
      </NuxtLink>
    </div>

    <!-- Tabs -->
    <div
      class="mb-6 flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1 sm:w-max"
    >
      <button
        class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="
          activeTab === 'upcoming'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="setActiveTab('upcoming')"
      >
        {{ t("events.tabs.upcoming") }}
      </button>
      <button
        class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="
          activeTab === 'past'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="setActiveTab('past')"
      >
        {{ t("events.tabs.past") }}
      </button>
      <button
        v-if="user"
        class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="
          activeTab === 'participations'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        "
        @click="setActiveTab('participations')"
      >
        {{ t("events.tabs.participations") }}
        <span class="ml-1 text-gray-400">({{ participationCount }})</span>
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
      class="mx-auto max-w-md py-12 text-center"
    >
      <p class="text-sm font-semibold text-gray-700">
        {{ emptyState.title }}
      </p>
      <p class="mt-1 text-sm text-gray-400">
        {{ emptyState.body }}
      </p>
      <div class="mt-5 flex justify-center">
        <button
          v-if="emptyState.action === 'clear'"
          class="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          @click="clearFilters"
        >
          {{ t("events.emptyState.actions.clearFilters") }}
        </button>
        <button
          v-else-if="emptyState.action === 'past'"
          class="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          @click="setActiveTab('past')"
        >
          {{ t("events.emptyState.actions.viewPast") }}
        </button>
        <button
          v-else
          class="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          @click="setActiveTab('upcoming')"
        >
          {{ t("events.emptyState.actions.viewUpcoming") }}
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-else class="space-y-10">
      <div v-for="group in eventGroups" :key="group.label">
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
            :prefer-participation="
              !!user &&
              (activeTab === 'past' || activeTab === 'participations')
            "
            :return-to="activeTab"
          />
        </div>
      </div>
    </div>
  </div>
</template>
