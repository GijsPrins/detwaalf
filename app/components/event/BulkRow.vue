<script setup lang="ts">
import { EVENT_DISTANCE_ORDER } from "~/constants/distances";
import { formatEventDate } from "~/mappers/events";
import type { EventRow } from "~/queries/events";
import type { EventDistance } from "~/types/events";
import {
  isBulkEventRowReady,
  toggleEventDistance,
  type BulkEventRow,
} from "~/utils/bulkEventRows";
import type { EventDuplicateMatch } from "~/utils/eventDuplicates";

const props = defineProps<{
  row: BulkEventRow;
  provinces: { id: number; name: string }[];
  duplicate: EventDuplicateMatch<EventRow> | null;
}>();

const emit = defineEmits<{
  "update:row": [value: BulkEventRow];
  fetch: [];
  save: [];
  remove: [];
  lookupProvince: [];
  lookupPlace: [];
}>();

const { t } = useI18n();
const id = useId();

const isBusy = computed(
  () => props.row.status === "fetching" || props.row.status === "saving",
);
const isLocked = computed(() => isBusy.value || props.row.status === "saved");
const canFetch = computed(() => !isLocked.value && props.row.eventUrl.trim().length > 0);
const canSave = computed(() => !isBusy.value && isBulkEventRowReady(props.row));
const otherDateOptions = computed(() =>
  props.row.dateOptions.filter((date) => date !== props.row.eventDate),
);
const showDateOptions = computed(
  () => otherDateOptions.value.length > 0 && !isLocked.value,
);
const showDuplicate = computed(
  () => props.duplicate !== null && props.row.status !== "saved",
);
const saveLabel = computed(() => {
  if (props.row.status === "saving") return t("admin.events.saving");
  return props.duplicate ? t("admin.events.saveAnyway") : t("admin.events.save");
});
const otherDistancesLabel = computed(() =>
  props.row.otherDistancesKm
    .map((km) => t("admin.events.kilometers", { km: String(km).replace(".", ",") }))
    .join(", "),
);

function update(patch: Partial<BulkEventRow>) {
  emit("update:row", { ...props.row, ...patch });
}

function onInput(
  field: "eventUrl" | "registrationUrl" | "name" | "eventDate" | "location",
  event: Event,
) {
  update({ [field]: (event.target as HTMLInputElement).value });
}

function onProvinceChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  update({ provinceId: value ? Number(value) : null });
}

function toggleDistance(distance: EventDistance) {
  update({ distances: toggleEventDistance(props.row.distances, distance) });
}

function distanceClass(distance: EventDistance) {
  return props.row.distances.includes(distance)
    ? "bg-orange-100 text-orange-700"
    : "text-gray-500 hover:text-gray-900 border border-gray-200";
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
    <div class="flex gap-2">
      <label :for="`${id}-url`" class="sr-only">
        {{ t("admin.events.fields.eventUrl") }}
      </label>
      <input
        :id="`${id}-url`"
        :value="row.eventUrl"
        type="url"
        :disabled="isLocked"
        :placeholder="t('admin.events.fields.eventUrlPlaceholder')"
        class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
        @input="onInput('eventUrl', $event)"
      />
      <button
        type="button"
        :disabled="!canFetch"
        class="rounded-lg border border-orange-200 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        @click="emit('fetch')"
      >
        {{
          row.status === "fetching"
            ? t("admin.events.fetching")
            : t("admin.events.fetch")
        }}
      </button>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="flex flex-col gap-1.5">
        <label :for="`${id}-name`" class="text-xs text-gray-500">
          {{ t("admin.events.fields.name") }}
        </label>
        <input
          :id="`${id}-name`"
          :value="row.name"
          type="text"
          :disabled="isLocked"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
          @input="onInput('name', $event)"
          @blur="emit('lookupPlace')"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label :for="`${id}-date`" class="text-xs text-gray-500">
          {{ t("admin.events.fields.date") }}
        </label>
        <input
          :id="`${id}-date`"
          :value="row.eventDate"
          type="date"
          :disabled="isLocked"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
          @input="onInput('eventDate', $event)"
        />
        <div
          v-if="showDateOptions"
          class="flex flex-wrap items-center gap-1"
        >
          <span class="text-xs text-gray-400">{{ t("admin.events.otherDates") }}</span>
          <button
            v-for="date in otherDateOptions"
            :key="date"
            type="button"
            class="text-xs text-orange-600 hover:text-orange-700"
            @click="update({ eventDate: date })"
          >
            {{ formatEventDate(date) }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label :for="`${id}-location`" class="text-xs text-gray-500">
          {{ t("admin.events.fields.location") }}
        </label>
        <input
          :id="`${id}-location`"
          :value="row.location"
          type="text"
          :disabled="isLocked"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
          @input="onInput('location', $event)"
          @blur="emit('lookupProvince')"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label :for="`${id}-province`" class="text-xs text-gray-500">
          {{ t("admin.events.fields.province") }}
        </label>
        <select
          :id="`${id}-province`"
          :value="row.provinceId ?? ''"
          :disabled="isLocked"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white disabled:bg-gray-50"
          @change="onProvinceChange"
        >
          <option value="" disabled>
            {{ t("eventForm.fields.provincePlaceholder") }}
          </option>
          <option v-for="province in provinces" :key="province.id" :value="province.id">
            {{ province.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex flex-col gap-1.5">
      <label :for="`${id}-registration`" class="text-xs text-gray-500">
        {{ t("admin.events.fields.registrationUrl") }}
      </label>
      <input
        :id="`${id}-registration`"
        :value="row.registrationUrl"
        type="url"
        :disabled="isLocked"
        :placeholder="t('admin.events.fields.registrationUrlPlaceholder')"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
        @input="onInput('registrationUrl', $event)"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="distance in EVENT_DISTANCE_ORDER"
        :key="distance"
        type="button"
        :disabled="isLocked"
        :aria-pressed="row.distances.includes(distance)"
        class="px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-60"
        :class="distanceClass(distance)"
        @click="toggleDistance(distance)"
      >
        {{ t(`eventDistance.${distance}`) }}
      </button>
      <span v-if="otherDistancesLabel" class="text-xs text-gray-400">
        {{ t("admin.events.otherDistances", { distances: otherDistancesLabel }) }}
      </span>
    </div>

    <p v-if="showDuplicate && duplicate" class="text-xs text-orange-700">
      {{ t("admin.events.duplicate") }}
      <NuxtLink
        :to="`/events/${duplicate.event.id}`"
        target="_blank"
        class="font-medium underline hover:text-orange-900"
      >
        {{ duplicate.event.name }} &middot; {{ formatEventDate(duplicate.event.event_date) }}
      </NuxtLink>
    </p>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs" :class="row.status === 'error' ? 'text-red-600' : 'text-gray-400'">
        <template v-if="row.status === 'saved' && row.savedEventId">
          <NuxtLink
            :to="`/events/${row.savedEventId}`"
            target="_blank"
            class="text-green-700 hover:text-green-800"
          >
            {{ t("admin.events.saved") }}
          </NuxtLink>
        </template>
        <template v-else-if="row.errorKey">
          {{ t(row.errorKey) }}
        </template>
      </p>

      <div v-if="row.status !== 'saved'" class="flex items-center gap-3">
        <button
          type="button"
          :disabled="isBusy"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
          @click="emit('remove')"
        >
          {{ t("admin.events.remove") }}
        </button>
        <button
          type="button"
          :disabled="!canSave"
          class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="emit('save')"
        >
          {{ saveLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
