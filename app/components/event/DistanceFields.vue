<script setup lang="ts">
import type { EventDistanceInput, EventDistance } from "~/types/events";
import { EVENT_DISTANCE_ORDER } from "~/constants/distances";
import {
  createEmptyEventDistanceInput,
  getDistanceCategoryForEventDistance,
  getDistanceCategoryLabel,
} from "~/utils/eventDistances";

const props = withDefaults(
  defineProps<{
    modelValue: EventDistanceInput[];
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: EventDistanceInput[]];
}>();

const { t } = useI18n();

const offeredDistanceOptions = computed(() =>
  EVENT_DISTANCE_ORDER.map((distance) => ({
    value: distance,
    label: t(`eventDistance.${distance}`),
  })),
);

function updateDistance(index: number, patch: Partial<EventDistanceInput>) {
  const next = props.modelValue.map((distance, distanceIndex) =>
    distanceIndex === index ? { ...distance, ...patch } : distance,
  );

  emit("update:modelValue", next);
}

function onDistanceChange(index: number, event: Event) {
  const selectedDistance = (event.target as HTMLSelectElement)
    .value as EventDistance;

  updateDistance(index, {
    distance: selectedDistance,
    distanceCategory: getDistanceCategoryForEventDistance(selectedDistance),
  });
}

function getCountsTowardsLabel(distance: EventDistanceInput) {
  return getDistanceCategoryLabel(distance.distanceCategory, t);
}

function addDistance() {
  emit("update:modelValue", [
    ...props.modelValue,
    createEmptyEventDistanceInput(),
  ]);
}

function removeDistance(index: number) {
  const next = props.modelValue.filter(
    (_, distanceIndex) => distanceIndex !== index,
  );
  emit(
    "update:modelValue",
    next.length > 0 ? next : [createEmptyEventDistanceInput()],
  );
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm font-medium text-gray-700">{{
        t("eventForm.fields.distances")
      }}</span>
      <button
        type="button"
        class="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50"
        :disabled="disabled"
        @click="addDistance"
      >
        + {{ t("eventForm.addDistance") }}
      </button>
    </div>

    <p class="text-xs text-gray-500">
      {{ t("eventForm.distanceHelp") }}
    </p>

    <div class="flex flex-col gap-3">
      <div
        v-for="(distance, index) in modelValue"
        :key="index"
        class="rounded-xl border border-gray-100 p-4"
      >
        <div
          class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-end"
        >
          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-medium text-gray-700"
              :for="`distance-option-${index}`"
            >
              {{ t("eventForm.fields.distanceOption") }}
            </label>
            <select
              :id="`distance-option-${index}`"
              :value="distance.distance"
              :disabled="disabled"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white"
              @change="onDistanceChange(index, $event)"
            >
              <option
                v-for="option in offeredDistanceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-medium text-gray-700"
              :for="`distance-counts-${index}`"
            >
              {{ t("eventForm.fields.countsTowards") }}
            </label>
            <p
              :id="`distance-counts-${index}`"
              class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            >
              {{ getCountsTowardsLabel(distance) }}
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50"
            :disabled="disabled"
            @click="removeDistance(index)"
          >
            {{ t("eventForm.removeDistance") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
