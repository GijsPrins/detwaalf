<script setup lang="ts">
export interface PendingEvent {
  participationId: string;
  eventId: string;
  eventName: string;
  province: string;
  distance: string;
  eventDate: string;
}

defineProps<{ events: PendingEvent[] }>();
defineEmits<{ complete: [eventId: string] }>();

const { t } = useI18n();
</script>

<template>
  <div v-if="events.length > 0" class="mb-5">
    <p class="text-sm font-semibold text-green-700 mb-2">
      {{ t("dashboard.completePrompt.heading") }}
    </p>
    <div class="flex flex-col gap-2">
      <div
        v-for="event in events"
        :key="event.participationId"
        class="bg-green-50 border border-green-100 rounded-xl px-5 py-4 flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-medium text-gray-900">{{ event.eventName }}</p>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ event.province
            }}<template v-if="event.distance"
              > · {{ event.distance }}</template
            > · {{ event.eventDate }}
          </p>
        </div>
        <button
          class="text-sm font-medium text-green-700 hover:text-green-800 transition-colors shrink-0 ml-4"
          @click="$emit('complete', event.eventId)"
        >
          {{ t("dashboard.completePrompt.cta") }} →
        </button>
      </div>
    </div>
  </div>
</template>
