<script setup lang="ts">
export interface CancelledEventSuggestion {
  participationId: string;
  eventId: string;
  eventName: string;
  province: string;
  distance: string;
  eventDate: string;
  cancelledCount: number;
}

defineProps<{ events: CancelledEventSuggestion[] }>();
defineEmits<{ cancelEvent: [eventId: string] }>();

const { t } = useI18n();
</script>

<template>
  <div v-if="events.length > 0" class="mb-5">
    <p class="text-sm font-semibold text-red-700 mb-2">
      {{ t("dashboard.cancellationPrompt.heading") }}
    </p>
    <div class="flex flex-col gap-2">
      <div
        v-for="event in events"
        :key="event.participationId"
        class="bg-red-50 border border-red-100 rounded-xl px-5 py-4 flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-medium text-gray-900">{{ event.eventName }}</p>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ t("dashboard.cancellationPrompt.body", {
              count: event.cancelledCount,
            }) }}
          </p>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ event.province
            }}<template v-if="event.distance"
              > &middot; {{ event.distance }}</template
            >
            &middot; {{ event.eventDate }}
          </p>
        </div>
        <button
          class="text-sm font-medium text-red-700 hover:text-red-800 transition-colors shrink-0 ml-4"
          @click="$emit('cancelEvent', event.eventId)"
        >
          {{ t("dashboard.cancellationPrompt.cta") }} &rarr;
        </button>
      </div>
    </div>
  </div>
</template>
