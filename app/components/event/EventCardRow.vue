<script setup lang="ts">
import { computed } from "vue";
import type { Enums } from "~/types/database.types";
import type { EventViewModel, EventDistanceViewModel } from "~/mappers/events";
import { formatEventDistanceLabel } from "~/utils/eventDistances";
import { getEventRegistrationCta } from "~/utils/eventRegistrationCta";
import { PARTICIPATION_STATUS_BADGE_CLASS } from "~/constants/participation";

const { t } = useI18n();

const props = defineProps<{
  event: EventViewModel;
  preferParticipation?: boolean;
  returnTo?: "upcoming" | "past" | "participations";
}>();

const statusBadgeClass = PARTICIPATION_STATUS_BADGE_CLASS;

const DISTANCE_STATUS_CLASS: Record<Enums<"participation_status">, string> = {
  interested: "bg-orange-50 border-orange-200 text-orange-700",
  signed_up: "bg-blue-50 border-blue-200 text-blue-700",
  completed: "bg-green-50 border-green-200 text-green-700",
  dns: "bg-gray-100 border-gray-200 text-gray-500",
  dnf: "bg-gray-100 border-gray-200 text-gray-500",
};

function renderDistance(distance: EventDistanceViewModel) {
  return formatEventDistanceLabel(distance, t);
}

const registrationCta = computed(() => getEventRegistrationCta(props.event));

const requiresAction = computed(() => registrationCta.value.type === "open");

const futureRegistrationDate = computed(() => {
  if (registrationCta.value.type !== "future") return null;

  return new Date(registrationCta.value.opensOn).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
  });
});

const eventTarget = computed(() => {
  const query = new URLSearchParams();

  if (props.preferParticipation) {
    query.set("tab", "participation");
  }

  if (props.returnTo) {
    query.set("from", props.returnTo);
  }

  const queryString = query.toString();
  return `/events/${props.event.id}${queryString ? `?${queryString}` : ""}`;
});
</script>

<template>
  <NuxtLink
    :to="eventTarget"
    class="group bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-300 hover:shadow-sm transition-all duration-200 flex items-center md:items-stretch gap-5"
  >
    <!-- Calendar Left Anchor -->
    <div class="flex flex-col items-center justify-center bg-gray-50 rounded-lg w-14 py-2 border border-gray-100 shrink-0">
      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest -mb-0.5">
        {{ new Date(event.eventDate).toLocaleDateString("nl-NL", { month: "short" }).replace('.', '') }}
      </span>
      <span class="text-xl font-black text-gray-900 mt-1">
        {{ new Date(event.eventDate).getDate() }}
      </span>
    </div>

    <!-- Content Area -->
    <div class="flex-1 min-w-0 py-0.5 mt-1 sm:mt-0">
      <div class="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
        <h3 class="text-base font-bold text-gray-900 group-hover:text-orange-700 transition-colors truncate">
          {{ event.name }}
        </h3>

        <span
          v-if="event.participationStatus && !event.participationDistanceId"
          class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide"
          :class="statusBadgeClass[event.participationStatus]"
        >
          {{ t(`events.status.${event.participationStatus}`) }}
        </span>

        <span
          v-if="requiresAction"
          class="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide bg-orange-100 text-orange-700 uppercase animate-pulse border border-orange-200 shadow-sm"
        >
          {{ t("events.cta.signupOpen") }}
        </span>

        <span
          v-if="!requiresAction && futureRegistrationDate"
          class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide bg-gray-50 text-gray-500 border border-gray-200"
        >
          {{ t("events.cta.signupFuture", { date: futureRegistrationDate }) }}
        </span>
      </div>
      
      <p class="text-sm text-gray-500 truncate mb-2">
        {{ event.provinceName }}
        <template v-if="event.location">
          <span class="text-gray-300 mx-1">&middot;</span> {{ event.location }}
        </template>
      </p>

      <!-- Distances inline footer -->
      <div class="flex flex-wrap gap-1.5 mt-auto">
        <span
          v-for="dist in event.distances"
          :key="dist.id"
          class="px-2 py-0.5 border rounded text-[11px] font-medium transition-colors"
          :class="
            dist.id === event.participationDistanceId && event.participationStatus
              ? DISTANCE_STATUS_CLASS[event.participationStatus]
              : 'bg-white border-gray-100 text-gray-500 group-hover:border-orange-100'
          "
        >
          {{ renderDistance(dist) }}
        </span>
      </div>
    </div>
    
    <!-- Right Chevron -->
    <div class="hidden sm:flex items-center justify-center pl-2 pr-1 shrink-0 text-gray-300 group-hover:text-orange-500 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  </NuxtLink>
</template>
