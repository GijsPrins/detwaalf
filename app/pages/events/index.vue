<script setup lang="ts">
import type { Enums } from "~/types/database.types";
import { formatEventDate } from "~/mappers/events";
import { PARTICIPATION_STATUS_BADGE_CLASS } from "~/constants/participation";

definePageMeta({ auth: false });

const { t } = useI18n();
useHead(() => ({ title: t("nav.events") }));

const user = useSupabaseUser();
const { data: events, isPending } = useEventList();
const { data: provinces } = useProvinces();

type StatusFilter = "all" | Enums<"participation_status">;

const statusFilter = ref<StatusFilter>("all");
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

const statusBadgeClass = PARTICIPATION_STATUS_BADGE_CLASS;

const filteredEvents = computed(() => {
  let list = events.value ?? [];

  if (statusFilter.value !== "all") {
    list = list.filter((e) => e.participationStatus === statusFilter.value);
  }

  if (provinceFilter.value !== null) {
    list = list.filter((e) => e.provinceId === provinceFilter.value);
  }

  if (sortBy.value === "name") {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, "nl"));
  }

  return list;
});
</script>

<template>
  <div>
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
      <NuxtLink
        v-if="user"
        to="/events/new"
        class="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        + {{ t("events.new") }}
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <!-- Status pills (only when logged in) -->
      <div v-if="user" class="flex items-center gap-1">
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

      <div class="flex items-center gap-2 ml-auto">
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

    <!-- List -->
    <div v-if="isPending" class="text-sm text-gray-400 py-12 text-center">
      &hellip;
    </div>

    <div
      v-else-if="filteredEvents.length === 0"
      class="text-sm text-gray-400 py-12 text-center"
    >
      {{ t("events.empty") }}
    </div>

    <div
      v-else
      class="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50"
    >
      <NuxtLink
        v-for="event in filteredEvents"
        :key="event.id"
        :to="`/events/${event.id}`"
        class="flex items-start justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div>
          <p class="text-sm font-medium text-gray-900">{{ event.name }}</p>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ event.provinceName }}
            · {{ t(`distance.${event.distanceCategory}`) }}
            <template v-if="event.location"> · {{ event.location }}</template>
          </p>
        </div>
        <div class="text-right ml-6 shrink-0">
          <p class="text-xs text-gray-400">
            {{ formatEventDate(event.eventDate) }}
          </p>
          <span
            v-if="event.participationStatus"
            class="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
            :class="statusBadgeClass[event.participationStatus]"
          >
            {{ t(`events.status.${event.participationStatus}`) }}
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
