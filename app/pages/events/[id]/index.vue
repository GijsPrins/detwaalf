<script setup lang="ts">
import type { Enums } from "~/types/database.types";
import { formatEventDate } from "~/mappers/events";
import { PARTICIPATION_STATUS_BADGE_CLASS } from "~/constants/participation";
import { DISTANCE_BADGE_CLASS } from "~/constants/distances";
import {
  getDistanceCategoryLabel,
  getEventDistanceLabel,
} from "~/utils/eventDistances";

definePageMeta({ auth: false });

const { t } = useI18n();
const route = useRoute();
const eventId = computed(() => route.params.id as string);

const user = useSupabaseUser();
const { data: event, isPending, isError } = useEvent(eventId);
const { data: participation } = useEventParticipation(eventId);
const { data: canEdit } = useCanManageEvents();
const { mutate: setStatus, isPending: isSettingStatus } =
  useSetParticipation(eventId);
const { mutate: clearStatus, isPending: isClearingStatus } =
  useClearParticipation(eventId);
const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent(eventId);
const confirmingDelete = ref(false);

useHead(() => ({ title: event.value?.name ?? t("events.title") }));

const statusOptions: { value: Enums<"participation_status">; label: string }[] =
  [
    { value: "interested", label: t("events.status.interested") },
    { value: "signed_up", label: t("events.status.signed_up") },
    { value: "completed", label: t("events.status.completed") },
    { value: "dns", label: t("events.status.dns") },
    { value: "dnf", label: t("events.status.dnf") },
  ];

const statusNeedsDistance: Enums<"participation_status">[] = [
  "interested",
  "signed_up",
  "completed",
];

const selectedParticipationDistanceId = ref<string | null>(null);
const optimisticParticipationStatus = ref<
  Enums<"participation_status"> | null | undefined
>(undefined);
const optimisticParticipationDistanceId = ref<string | null | undefined>(
  undefined,
);

watch(
  [event, participation],
  ([eventValue, participationValue]) => {
    if (!eventValue) return;

    if (participationValue?.event_distance_id) {
      selectedParticipationDistanceId.value =
        participationValue.event_distance_id;
      return;
    }

    if (eventValue.distances.length === 1) {
      selectedParticipationDistanceId.value =
        eventValue.distances[0]?.id ?? null;
    }
  },
  { immediate: true },
);

const currentParticipationStatus = computed(
  () =>
    optimisticParticipationStatus.value ?? participation.value?.status ?? null,
);

const currentParticipationDistanceId = computed(
  () =>
    optimisticParticipationDistanceId.value ??
    participation.value?.event_distance_id ??
    null,
);

const currentParticipationBadgeClass = computed(() => {
  if (!currentParticipationStatus.value) return "";
  return PARTICIPATION_STATUS_BADGE_CLASS[currentParticipationStatus.value];
});

const hasDetails = computed(
  () =>
    !!(
      event.value?.location ||
      event.value?.registrationOpens ||
      event.value?.registrationDeadline ||
      event.value?.eventUrl ||
      event.value?.registrationUrl
    ),
);

function getDistanceLabel(distance: { distance: Enums<"event_distance"> }) {
  return getEventDistanceLabel(distance.distance, t);
}

function formatFinishTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function getDistanceCategoryBadgeClass(distance: {
  distanceCategory: Enums<"distance_category">;
}) {
  return DISTANCE_BADGE_CLASS[distance.distanceCategory];
}

function getDistanceCategoryText(distance: {
  distanceCategory: Enums<"distance_category">;
}) {
  return getDistanceCategoryLabel(distance.distanceCategory, t);
}

const participationDistanceOptions = computed(() =>
  (event.value?.distances ?? []).map((distance) => ({
    id: distance.id,
    label: getDistanceLabel(distance),
  })),
);

const selectedParticipationDistanceLabel = computed(() => {
  if (!currentParticipationDistanceId.value || !event.value) return null;
  const match = event.value.distances.find(
    (distance) => distance.id === currentParticipationDistanceId.value,
  );
  return match ? getDistanceLabel(match) : null;
});

const currentParticipationSummary = computed(() => {
  if (!currentParticipationStatus.value) return null;

  if (
    selectedParticipationDistanceLabel.value &&
    statusNeedsDistance.includes(currentParticipationStatus.value)
  ) {
    return t("eventDetail.participation.summaryWithDistance", {
      status: t(
        `events.status.${currentParticipationStatus.value}`,
      ).toLowerCase(),
      distance: selectedParticipationDistanceLabel.value,
    });
  }

  return t("eventDetail.participation.summary", {
    status: t(
      `events.status.${currentParticipationStatus.value}`,
    ).toLowerCase(),
  });
});

const shouldAskParticipationDistance = computed(
  () => (event.value?.distances.length ?? 0) > 1,
);

const singleParticipationDistanceLabel = computed(() => {
  if (shouldAskParticipationDistance.value || !event.value?.distances.length) {
    return null;
  }

  return getDistanceLabel(event.value.distances[0]!);
});

const hasRecordedDetails = computed(() => {
  const p = participation.value;
  if (!p) return false;
  if (p.status === "completed")
    return p.finish_time_seconds != null || !!p.timing_url;
  if (p.status === "dns" || p.status === "dnf") return !!p.notes;
  return false;
});

const participationDistanceError = ref(false);

function setParticipationStatus(status: Enums<"participation_status">) {
  const previousStatus = currentParticipationStatus.value;
  const previousDistanceId = currentParticipationDistanceId.value;
  const selectedDistanceId = selectedParticipationDistanceId.value;
  const needsDistance = statusNeedsDistance.includes(status);

  if (
    needsDistance &&
    shouldAskParticipationDistance.value &&
    !selectedDistanceId
  ) {
    participationDistanceError.value = true;
    return;
  }

  participationDistanceError.value = false;

  optimisticParticipationStatus.value = status;
  optimisticParticipationDistanceId.value = needsDistance
    ? selectedDistanceId
    : null;

  setStatus(
    {
      status,
      eventDistanceId: needsDistance ? selectedDistanceId : null,
    },
    {
      onError: () => {
        optimisticParticipationStatus.value = previousStatus;
        optimisticParticipationDistanceId.value = previousDistanceId;
      },
      onSuccess: () => {
        optimisticParticipationStatus.value = undefined;
        optimisticParticipationDistanceId.value = undefined;
      },
    },
  );
}

function clearParticipationStatus() {
  const previousStatus = currentParticipationStatus.value;
  const previousDistanceId = currentParticipationDistanceId.value;

  optimisticParticipationStatus.value = null;
  optimisticParticipationDistanceId.value = null;

  clearStatus(undefined, {
    onError: () => {
      optimisticParticipationStatus.value = previousStatus;
      optimisticParticipationDistanceId.value = previousDistanceId;
    },
    onSuccess: () => {
      optimisticParticipationStatus.value = undefined;
      optimisticParticipationDistanceId.value = undefined;
    },
  });
}

const registrationStatus = computed(() => {
  if (!event.value) return null;

  const now = new Date();
  const opens = event.value.registrationOpens
    ? new Date(event.value.registrationOpens)
    : null;
  const deadline = event.value.registrationDeadline
    ? new Date(event.value.registrationDeadline)
    : null;

  if (deadline && deadline < now) {
    return {
      tone: "text-gray-500",
      text: t("eventDetail.registrationStatus.closed"),
    };
  }

  if (opens && opens > now) {
    return {
      tone: "text-gray-500",
      text: t("eventDetail.registrationStatus.opensOn", {
        date: formatEventDate(event.value.registrationOpens!),
      }),
    };
  }

  if (deadline) {
    return {
      tone: "text-orange-600",
      text: t("eventDetail.registrationStatus.openUntil", {
        date: formatEventDate(event.value.registrationDeadline!),
      }),
    };
  }

  if (event.value.registrationUrl) {
    return {
      tone: "text-orange-600",
      text: t("eventDetail.registrationStatus.open"),
    };
  }

  return {
    tone: "text-gray-500",
    text: t("eventDetail.registrationStatus.unknown"),
  };
});
</script>

<template>
  <div class="max-w-2xl mx-auto pb-12">
    <!-- Back + edit -->
    <div class="flex items-center justify-between mb-8">
      <NuxtLink
        to="/events"
        class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        ← {{ t("nav.events") }}
      </NuxtLink>
      <div v-if="canEdit && event" class="flex items-center gap-3">
        <template v-if="confirmingDelete">
          <span class="text-sm text-gray-500">{{
            t("eventDetail.deleteConfirm")
          }}</span>
          <button
            :disabled="isDeleting"
            class="text-sm font-medium text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
            @click="deleteEvent()"
          >
            {{ t("eventDetail.deleteConfirmYes") }}
          </button>
          <button
            class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            @click="confirmingDelete = false"
          >
            {{ t("eventDetail.deleteConfirmNo") }}
          </button>
        </template>
        <button
          v-else
          class="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
          @click="confirmingDelete = true"
        >
          {{ t("eventDetail.delete") }}
        </button>
        <NuxtLink
          :to="`/events/${event.id}/edit`"
          class="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
        >
          {{ t("eventDetail.edit") }}
        </NuxtLink>
      </div>
    </div>

    <div v-if="isPending" class="text-sm text-gray-400 py-12 text-center">
      &hellip;
    </div>

    <div
      v-else-if="isError || !event"
      class="text-sm text-gray-500 py-12 text-center"
    >
      {{ t("eventDetail.notFound") }}
    </div>

    <template v-else>
      <!-- Event header -->
      <div class="flex items-start justify-between gap-6 mb-6">
        <div class="min-w-0">
          <h1
            class="text-3xl font-bold text-gray-900 tracking-tight leading-tight"
          >
            {{ event.name }}
          </h1>
          <p class="text-sm text-gray-500 mt-2">
            {{ event.provinceName }}
            · {{ formatEventDate(event.eventDate) }}
          </p>
          <p
            v-if="registrationStatus"
            class="text-sm font-medium mt-3"
            :class="registrationStatus.tone"
          >
            {{ registrationStatus.text }}
          </p>

          <div v-if="event.registrationUrl" class="mt-4">
            <a
              :href="event.registrationUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
            >
              {{ t("eventDetail.register") }} →
            </a>
          </div>
        </div>
        <div class="shrink-0 w-24 h-24 sm:w-32 sm:h-32">
          <ProvinceShape :province-id="event.provinceId" />
        </div>
      </div>

      <!-- Challenge relevance -->
      <div class="border-t border-gray-100 pt-6 mb-8">
        <p class="text-sm font-semibold text-gray-900 mb-3">
          {{ t("eventDetail.challengeTitle") }}
        </p>
        <p class="text-xs text-gray-500 mb-4">
          {{ t("eventDetail.challengeHint") }}
        </p>

        <div class="flex flex-col gap-2">
          <div
            v-for="distance in event.distances"
            :key="distance.id"
            class="flex items-center justify-between py-1"
          >
            <span class="text-sm text-gray-700">{{
              getDistanceLabel(distance)
            }}</span>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="getDistanceCategoryBadgeClass(distance)"
            >
              {{ getDistanceCategoryText(distance) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Details -->
      <div v-if="hasDetails" class="flex flex-col gap-3 mb-10">
        <div v-if="event.location" class="flex flex-col sm:flex-row sm:gap-4">
          <span
            class="text-xs text-gray-400 sm:w-36 shrink-0 pt-0.5 uppercase tracking-wide"
          >
            {{ t("eventDetail.location") }}
          </span>
          <span class="text-sm text-gray-700 mt-1 sm:mt-0">{{
            event.location
          }}</span>
        </div>
        <div
          v-if="event.registrationOpens"
          class="flex flex-col sm:flex-row sm:gap-4"
        >
          <span
            class="text-xs text-gray-400 sm:w-36 shrink-0 pt-0.5 uppercase tracking-wide"
          >
            {{ t("eventDetail.registrationOpens") }}
          </span>
          <span class="text-sm text-gray-700 mt-1 sm:mt-0">{{
            formatEventDate(event.registrationOpens)
          }}</span>
        </div>
        <div
          v-if="event.registrationDeadline"
          class="flex flex-col sm:flex-row sm:gap-4"
        >
          <span
            class="text-xs text-gray-400 sm:w-36 shrink-0 pt-0.5 uppercase tracking-wide"
          >
            {{ t("eventDetail.registrationDeadline") }}
          </span>
          <span class="text-sm text-gray-700 mt-1 sm:mt-0">{{
            formatEventDate(event.registrationDeadline)
          }}</span>
        </div>
        <div
          v-if="event.eventUrl || event.registrationUrl"
          class="flex flex-col sm:flex-row sm:gap-4 mt-3"
        >
          <span class="sm:w-36 shrink-0 hidden sm:block" />
          <div class="flex flex-wrap gap-2">
            <a
              v-if="event.eventUrl"
              :href="event.eventUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {{ t("eventDetail.website") }} →
            </a>
          </div>
        </div>
      </div>

      <!-- Participation -->
      <div class="border-t border-gray-100 pt-8">
        <p class="text-sm font-semibold text-gray-900 mb-4">
          {{ t("eventDetail.participation.title") }}
        </p>

        <template v-if="user">
          <div class="mb-6 flex flex-wrap items-center gap-3">
            <span
              v-if="currentParticipationStatus"
              class="text-xs font-medium px-2 py-1 rounded-full"
              :class="currentParticipationBadgeClass"
            >
              {{ t(`events.status.${currentParticipationStatus}`) }}
            </span>
            <p v-if="currentParticipationSummary" class="text-sm text-gray-700">
              {{ currentParticipationSummary }}
            </p>
            <p v-else class="text-sm text-gray-500">
              {{ t("eventDetail.participation.empty") }}
            </p>
          </div>

          <!-- Recorded result details -->
          <div
            v-if="hasRecordedDetails"
            class="flex flex-col gap-3 mb-6 py-4 border-t border-b border-gray-100"
          >
            <div
              v-if="participation?.finish_time_seconds != null"
              class="flex flex-col sm:flex-row sm:gap-4"
            >
              <span
                class="text-xs text-gray-400 sm:w-36 shrink-0 pt-0.5 uppercase tracking-wide"
              >
                {{ t("eventDetail.participation.finishTime") }}
              </span>
              <span class="text-sm text-gray-700 mt-1 sm:mt-0 font-medium">
                {{ formatFinishTime(participation.finish_time_seconds) }}
              </span>
            </div>
            <div
              v-if="participation?.timing_url"
              class="flex flex-col sm:flex-row sm:gap-4"
            >
              <span
                class="text-xs text-gray-400 sm:w-36 shrink-0 pt-0.5 uppercase tracking-wide"
              >
                {{ t("eventDetail.participation.timingUrl") }}
              </span>
              <a
                :href="participation.timing_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-orange-600 hover:text-orange-700 transition-colors mt-1 sm:mt-0"
              >
                {{ t("eventDetail.participation.timingUrlLink") }}
              </a>
            </div>
            <div
              v-if="participation?.notes"
              class="flex flex-col sm:flex-row sm:gap-4"
            >
              <span
                class="text-xs text-gray-400 sm:w-36 shrink-0 pt-0.5 uppercase tracking-wide"
              >
                {{ t("eventDetail.participation.notes") }}
              </span>
              <span class="text-sm text-gray-700 mt-1 sm:mt-0">{{
                participation.notes
              }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-5">
            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400 mb-2">
                {{ t("eventDetail.participation.stepDistance") }}
              </p>
              <p class="text-[13px] text-gray-500 mb-3">
                {{
                  shouldAskParticipationDistance
                    ? t("eventDetail.participation.setWithDistance")
                    : t("eventDetail.participation.singleDistanceHint")
                }}
              </p>

              <div v-if="shouldAskParticipationDistance" class="max-w-xs">
                <label
                  for="participationDistance"
                  class="text-xs text-gray-500 block mb-1.5"
                >
                  {{ t("eventDetail.participation.distanceLabel") }}
                </label>
                <select
                  id="participationDistance"
                  v-model="selectedParticipationDistanceId"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  :disabled="isSettingStatus || isClearingStatus"
                  @change="participationDistanceError = false"
                >
                  <option :value="null">
                    {{ t("eventDetail.participation.distancePlaceholder") }}
                  </option>
                  <option
                    v-for="option in participationDistanceOptions"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <p
                  v-if="participationDistanceError"
                  class="text-xs text-red-600 mt-1.5"
                >
                  {{ t("eventDetail.participation.distanceRequired") }}
                </p>
              </div>

              <p
                v-else-if="singleParticipationDistanceLabel"
                class="text-sm text-gray-700"
              >
                {{ singleParticipationDistanceLabel }}
              </p>
            </div>

            <div>
              <p class="text-xs uppercase tracking-wide text-gray-400 mb-2">
                {{ t("eventDetail.participation.stepStatus") }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in statusOptions"
                  :key="option.value"
                  :disabled="isSettingStatus || isClearingStatus"
                  class="px-3.5 py-1.5 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === option.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  "
                  @click="setParticipationStatus(option.value)"
                >
                  {{ option.label }}
                </button>
                <button
                  :disabled="isSettingStatus || isClearingStatus"
                  class="px-3.5 py-1.5 border rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === null
                      ? 'border-gray-500 bg-gray-100 text-gray-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  "
                  @click="clearParticipationStatus()"
                >
                  {{ t("eventDetail.participation.clear") }}
                </button>
              </div>
            </div>
          </div>
        </template>

        <p v-else class="text-[13px] text-gray-500">
          <NuxtLink
            to="/login"
            class="text-orange-600 font-medium hover:text-orange-700 transition-colors"
          >
            {{ t("eventDetail.participation.loginLink") }}
          </NuxtLink>
          {{ t("eventDetail.participation.loginSuffix") }}
        </p>
      </div>
    </template>
  </div>
</template>
