<script setup lang="ts">
import type { Enums } from "~/types/database.types";
import { formatEventDate } from "~/mappers/events";
import { PARTICIPATION_STATUS_BADGE_CLASS } from "~/constants/participation";
import { DISTANCE_BADGE_CLASS } from "~/constants/distances";
import {
  getDistanceCategoryLabel,
  getEventDistanceLabel,
} from "~/utils/eventDistances";
import { getLocalDateString } from "~/utils/localDate";
import type {
  CompleteModalEvent,
  CompleteModalResult,
} from "~/components/participation/CompleteModal.vue";

definePageMeta({ auth: false });

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const eventId = computed(() => route.params.id as string);
type DetailTab = "event" | "participation";
const activeTab = ref<DetailTab>(
  route.query.tab === "participation" ? "participation" : "event",
);
const showCreatedHint = computed(
  () => activeTab.value === "participation" && route.query.created === "1",
);

const user = useSupabaseUser();
const { data: event, isPending, isError } = useEvent(eventId);
const { data: participation } = useEventParticipation(eventId);
const { data: canEdit } = useCanManageEvents();
const { mutate: setStatus, isPending: isSettingStatus } =
  useSetParticipation(eventId);
const { mutate: clearStatus, isPending: isClearingStatus } =
  useClearParticipation(eventId);
const { mutateAsync: completeParticipation, isPending: isCompleting } =
  useCompleteParticipation();
const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent(eventId);
const confirmingDelete = ref(false);
const modalEvent = ref<CompleteModalEvent | null>(null);
const modalInitialOutcome = ref<CompleteModalResult["status"] | null>(null);
const today = getLocalDateString();

useHead(() => ({ title: event.value?.name ?? t("events.title") }));

const backToEventsTarget = computed(() => {
  if (route.query.from === "past") return "/events?period=past";
  if (route.query.from === "participations") return "/events?tab=participations";
  return "/events";
});

function setActiveDetailTab(tab: DetailTab) {
  activeTab.value = tab;
  router.replace({
    query: {
      ...route.query,
      tab: tab === "participation" ? "participation" : undefined,
    },
  });
}

watch(
  () => route.query.tab,
  () => {
    activeTab.value =
      route.query.tab === "participation" ? "participation" : "event";
  },
);

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

const rawCurrentParticipationStatus = computed(
  () =>
    optimisticParticipationStatus.value ?? participation.value?.status ?? null,
);

const currentParticipationDistanceId = computed(
  () =>
    optimisticParticipationDistanceId.value ??
    participation.value?.event_distance_id ??
    null,
);

const participationNeedsMissingDistance = computed(() => {
  const status = rawCurrentParticipationStatus.value;
  return (
    !!status &&
    statusNeedsDistance.includes(status) &&
    shouldAskParticipationDistance.value &&
    !currentParticipationDistanceId.value
  );
});

const currentParticipationStatus = computed(() =>
  participationNeedsMissingDistance.value
    ? null
    : rawCurrentParticipationStatus.value,
);

const currentParticipationBadgeClass = computed(() => {
  if (!currentParticipationStatus.value) return "";
  return PARTICIPATION_STATUS_BADGE_CLASS[currentParticipationStatus.value];
});

const eventHasPassed = computed(() =>
  event.value ? event.value.eventDate <= today : false,
);

const hasResultStatus = computed(
  () =>
    currentParticipationStatus.value === "completed" ||
    currentParticipationStatus.value === "dns" ||
    currentParticipationStatus.value === "dnf" ||
    currentParticipationStatus.value === "cancelled",
);

const shouldShowResultActions = computed(
  () => eventHasPassed.value || hasResultStatus.value,
);

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

const activeParticipationDistanceId = computed(
  () => selectedParticipationDistanceId.value ?? currentParticipationDistanceId.value,
);

const activeParticipationDistance = computed(() => {
  if (!activeParticipationDistanceId.value || !event.value) return null;
  return (
    event.value.distances.find(
      (distance) => distance.id === activeParticipationDistanceId.value,
    ) ?? null
  );
});

const activeParticipationMedal = computed(() =>
  activeParticipationDistance.value
    ? getDistanceCategoryText(activeParticipationDistance.value)
    : null,
);

const participationCardBadge = computed(() => {
  if (currentParticipationStatus.value) {
    return t(`events.status.${currentParticipationStatus.value}`);
  }
  return eventHasPassed.value
    ? t("eventDetail.participation.card.badgePast")
    : t("eventDetail.participation.card.badgeFuture");
});

const participationTone = computed(() => {
  switch (currentParticipationStatus.value) {
    case "interested":
      return {
        activePanel: "border-orange-300 bg-orange-50",
        activeText: "text-orange-700",
        heroPanel: "border-orange-100 bg-orange-50",
        heroTitle: "text-orange-950",
        heroDescription: "text-orange-800",
      };
    case "signed_up":
      return {
        activePanel: "border-blue-300 bg-blue-50",
        activeText: "text-blue-700",
        heroPanel: "border-blue-100 bg-blue-50",
        heroTitle: "text-blue-950",
        heroDescription: "text-blue-800",
      };
    case "completed":
      return {
        activePanel: "border-green-200 bg-green-50",
        activeText: "text-green-700",
        heroPanel: "border-green-100 bg-green-50",
        heroTitle: "text-green-950",
        heroDescription: "text-green-800",
      };
    case "dns":
    case "dnf":
    case "cancelled":
      return {
        activePanel:
          currentParticipationStatus.value === "cancelled"
            ? "border-red-200 bg-red-50"
            : "border-gray-300 bg-gray-50",
        activeText:
          currentParticipationStatus.value === "cancelled"
            ? "text-red-700"
            : "text-gray-700",
        heroPanel:
          currentParticipationStatus.value === "cancelled"
            ? "border-red-100 bg-red-50"
            : "border-gray-100 bg-gray-50",
        heroTitle:
          currentParticipationStatus.value === "cancelled"
            ? "text-red-950"
            : "text-gray-900",
        heroDescription:
          currentParticipationStatus.value === "cancelled"
            ? "text-red-800"
            : "text-gray-600",
      };
    default:
      return {
        activePanel: "border-blue-200 bg-blue-50",
        activeText: "text-blue-700",
        heroPanel: "border-orange-100 bg-orange-50",
        heroTitle: "text-orange-950",
        heroDescription: "text-orange-800",
      };
  }
});

const participationHero = computed(() => {
  if (hasResultStatus.value) {
    return null;
  }

  if (currentParticipationStatus.value) {
    return {
      title: t("eventDetail.participation.card.readyTitle"),
      description: activeParticipationMedal.value
        ? t("eventDetail.participation.card.readyDescriptionWithMedal", {
            medal: activeParticipationMedal.value.toLowerCase(),
          })
        : t("eventDetail.participation.card.readyDescription"),
    };
  }

  return {
    title: eventHasPassed.value
      ? t("eventDetail.participation.card.pastTitle")
      : t("eventDetail.participation.card.futureTitle"),
    description: eventHasPassed.value
      ? t("eventDetail.participation.card.pastDescription")
      : t("eventDetail.participation.card.futureDescription"),
  };
});

const completedMedalHero = computed(() => {
  if (
    currentParticipationStatus.value !== "completed" ||
    !activeParticipationMedal.value ||
    !activeParticipationDistance.value ||
    !event.value
  ) {
    return null;
  }

  const tone = {
    "10k": {
      panel: "border-orange-200 bg-orange-50",
      icon: "border-orange-200 bg-white text-orange-700",
      text: "text-orange-950",
      description: "text-orange-800",
    },
    half: {
      panel: "border-gray-200 bg-gray-50",
      icon: "border-gray-200 bg-white text-gray-500",
      text: "text-gray-900",
      description: "text-gray-600",
    },
    marathon: {
      panel: "border-yellow-200 bg-yellow-50",
      icon: "border-yellow-200 bg-white text-yellow-600",
      text: "text-yellow-950",
      description: "text-yellow-800",
    },
  }[activeParticipationDistance.value.distanceCategory];

  return {
    medal: activeParticipationMedal.value,
    province: event.value.provinceName,
    panelClass: tone.panel,
    iconClass: tone.icon,
    textClass: tone.text,
    descriptionClass: tone.description,
    title: t("eventDetail.participation.card.medalTitle", {
      medal: activeParticipationMedal.value,
      province: event.value.provinceName,
    }),
    description: t("eventDetail.participation.card.medalDescription", {
      medal: activeParticipationMedal.value.toLowerCase(),
    }),
  };
});

const shouldAskParticipationDistance = computed(
  () => (event.value?.distances.length ?? 0) > 1,
);

const shouldShowSavedResult = computed(() => hasResultStatus.value);

const resultNotesLabel = computed(() =>
  currentParticipationStatus.value === "cancelled"
    ? t("dashboard.completeModal.cancellationReason")
    : t("eventDetail.participation.notes"),
);

const participationDistanceError = ref(false);

function buildCompleteModalEvent(): CompleteModalEvent | null {
  if (!event.value) return null;
  const selectedDistanceId = selectedParticipationDistanceId.value;
  const distanceLabel = selectedDistanceId
    ? (participationDistanceOptions.value.find(
        (option) => option.id === selectedDistanceId,
      )?.label ?? "")
    : "";

  return {
    eventId: event.value.id,
    eventDistanceId: selectedDistanceId,
    eventName: event.value.name,
    province: event.value.provinceName,
    distance: distanceLabel,
  };
}

function validateParticipationDistance(status: Enums<"participation_status">) {
  const needsDistance = statusNeedsDistance.includes(status);
  if (
    needsDistance &&
    shouldAskParticipationDistance.value &&
    !selectedParticipationDistanceId.value
  ) {
    participationDistanceError.value = true;
    return false;
  }

  participationDistanceError.value = false;
  return true;
}

function selectParticipationDistance(id: string) {
  selectedParticipationDistanceId.value = id;
  participationDistanceError.value = false;

  if (
    currentParticipationStatus.value === "interested" ||
    currentParticipationStatus.value === "signed_up"
  ) {
    setParticipationStatus(currentParticipationStatus.value);
  }
}

function isParticipationDistanceActive(id: string) {
  return activeParticipationDistanceId.value === id;
}

function setParticipationStatus(status: Enums<"participation_status">) {
  if (!validateParticipationDistance(status)) return;

  if (
    status === "completed" ||
    status === "dns" ||
    status === "dnf" ||
    status === "cancelled"
  ) {
    modalInitialOutcome.value = status;
    modalEvent.value = buildCompleteModalEvent();
    return;
  }

  const previousStatus = currentParticipationStatus.value;
  const previousDistanceId = currentParticipationDistanceId.value;
  const selectedDistanceId = selectedParticipationDistanceId.value;
  const needsDistance = statusNeedsDistance.includes(status);

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

async function handleCompleteConfirm(result: CompleteModalResult) {
  if (!modalEvent.value) return;

  const previousStatus = currentParticipationStatus.value;
  const previousDistanceId = currentParticipationDistanceId.value;

  optimisticParticipationStatus.value = result.status;
  const eventDistanceId =
    result.status === "completed" ? modalEvent.value.eventDistanceId : null;
  optimisticParticipationDistanceId.value = eventDistanceId;

  try {
    await completeParticipation({
      eventId: modalEvent.value.eventId,
      eventDistanceId,
      status: result.status,
      finishTimeSeconds: result.finishTimeSeconds,
      timingUrl: result.timingUrl,
      notes: result.notes,
    });
    modalEvent.value = null;
    modalInitialOutcome.value = null;
    optimisticParticipationStatus.value = undefined;
    optimisticParticipationDistanceId.value = undefined;
  } catch {
    optimisticParticipationStatus.value = previousStatus;
    optimisticParticipationDistanceId.value = previousDistanceId;
  }
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
        :to="backToEventsTarget"
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
            - {{ formatEventDate(event.eventDate) }}
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

      <div
        class="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-max mb-8"
      >
        <button
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
          :class="
            activeTab === 'event'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          "
          @click="setActiveDetailTab('event')"
        >
          {{ t("eventDetail.tabs.event") }}
        </button>
        <button
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
          :class="
            activeTab === 'participation'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          "
          @click="setActiveDetailTab('participation')"
        >
          {{ t("eventDetail.tabs.participation") }}
        </button>
      </div>

      <template v-if="activeTab === 'event'">
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
      </template>

      <!-- Participation -->
      <div v-else class="border-t border-gray-100 pt-8">
        <template v-if="user">
          <div
            v-if="showCreatedHint"
            class="mb-5 rounded-xl border border-orange-100 bg-orange-50 px-5 py-4"
          >
            <p class="text-sm font-medium text-orange-800">
              {{ t("eventDetail.participation.createdHintTitle") }}
            </p>
            <p class="text-sm text-orange-700 mt-1">
              {{ t("eventDetail.participation.createdHint") }}
            </p>
          </div>

          <div
            class="-mx-4 bg-white px-4 py-5 sm:mx-0 sm:rounded-xl sm:border sm:border-gray-100 sm:p-5 sm:shadow-sm"
          >
            <div class="mb-5 flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h2 class="text-xl font-semibold text-gray-900">
                  {{ t("eventDetail.participation.card.title") }}
                </h2>
                <p class="mt-1 text-sm text-gray-500">
                  {{ event.name }} - {{ formatEventDate(event.eventDate) }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                :class="
                  currentParticipationStatus
                    ? currentParticipationBadgeClass
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{ participationCardBadge }}
              </span>
            </div>

            <div
              v-if="completedMedalHero"
              class="mb-4 grid grid-cols-[3.25rem_1fr] gap-3 rounded-lg border p-3"
              :class="completedMedalHero.panelClass"
            >
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full border-2"
                :class="completedMedalHero.iconClass"
              >
                <span class="material-symbols-outlined" aria-hidden="true">
                  social_leaderboard
                </span>
              </div>
              <div>
                <p class="text-sm font-semibold" :class="completedMedalHero.textClass">
                  {{ completedMedalHero.title }}
                </p>
                <p
                  class="mt-1 text-sm"
                  :class="completedMedalHero.descriptionClass"
                >
                  {{ completedMedalHero.description }}
                </p>
              </div>
            </div>

            <div
              v-if="participationHero"
              class="mb-5 rounded-lg border p-4"
              :class="participationTone.heroPanel"
            >
              <p class="text-sm font-semibold" :class="participationTone.heroTitle">
                {{ participationHero.title }}
              </p>
              <p class="mt-1 text-sm" :class="participationTone.heroDescription">
                {{ participationHero.description }}
              </p>
            </div>

            <div class="border-t border-gray-100 pt-5">
              <div class="mb-3">
                <p class="text-sm font-semibold text-gray-900">
                  {{ t("eventDetail.participation.card.distanceTitle") }}
                </p>
              </div>

              <div v-if="shouldAskParticipationDistance" class="grid gap-2">
                <button
                  v-for="distance in event.distances"
                  :key="distance.id"
                  :disabled="isSettingStatus || isClearingStatus || isCompleting"
                  class="flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors disabled:opacity-50"
                  :class="
                    isParticipationDistanceActive(distance.id)
                      ? participationTone.activePanel
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  "
                  @click="selectParticipationDistance(distance.id)"
                >
                  <span>
                    <span
                      class="block text-sm font-medium"
                      :class="
                        isParticipationDistanceActive(distance.id)
                          ? participationTone.activeText
                          : 'text-gray-900'
                      "
                    >
                      {{ getDistanceLabel(distance) }}
                    </span>
                    <span class="mt-0.5 block text-xs text-gray-500">
                      {{
                        t("eventDetail.participation.card.countsFor", {
                          medal: getDistanceCategoryText(distance).toLowerCase(),
                        })
                      }}
                    </span>
                  </span>
                </button>
              </div>

              <div
                v-else-if="event.distances[0]"
                class="rounded-lg border px-3 py-3"
                :class="participationTone.activePanel"
              >
                <p class="text-sm font-medium" :class="participationTone.activeText">
                  {{ getDistanceLabel(event.distances[0]) }}
                </p>
                <p class="mt-0.5 text-xs text-gray-500">
                  {{
                    t("eventDetail.participation.card.countsFor", {
                      medal: getDistanceCategoryText(
                        event.distances[0],
                      ).toLowerCase(),
                    })
                  }}
                </p>
              </div>

              <p
                v-if="participationDistanceError"
                class="mt-2 text-xs text-red-600"
              >
                {{ t("eventDetail.participation.distanceRequired") }}
              </p>
            </div>

            <div class="mt-5 border-t border-gray-100 pt-5">
              <div class="mb-3">
                <p class="text-sm font-semibold text-gray-900">
                  {{ t("eventDetail.participation.card.planningTitle") }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  :disabled="isSettingStatus || isClearingStatus || isCompleting"
                  class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === 'interested'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  "
                  @click="setParticipationStatus('interested')"
                >
                  {{ t("events.status.interested") }}
                </button>
                <button
                  :disabled="isSettingStatus || isClearingStatus || isCompleting"
                  class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === 'signed_up'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  "
                  @click="setParticipationStatus('signed_up')"
                >
                  {{ t("events.status.signed_up") }}
                </button>
              </div>
            </div>

            <div
              v-if="shouldShowResultActions"
              class="mt-5 border-t border-gray-100 pt-5"
            >
              <div class="mb-3">
                <p class="text-sm font-semibold text-gray-900">
                  {{ t("eventDetail.participation.card.resultActionsTitle") }}
                </p>
              </div>
              <div class="grid gap-2">
                <button
                  :disabled="isSettingStatus || isClearingStatus || isCompleting"
                  class="rounded-lg border px-3 py-3 text-left transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  "
                  @click="setParticipationStatus('completed')"
                >
                  <span class="block text-sm font-medium text-gray-900">
                    {{ t("dashboard.completeModal.finished") }}
                  </span>
                  <span class="mt-0.5 block text-xs text-gray-500">
                    {{ t("eventDetail.participation.card.finishedHint") }}
                  </span>
                </button>
                <button
                  :disabled="isSettingStatus || isClearingStatus || isCompleting"
                  class="rounded-lg border px-3 py-3 text-left transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === 'dns'
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  "
                  @click="setParticipationStatus('dns')"
                >
                  <span class="block text-sm font-medium text-gray-900">
                    {{ t("dashboard.completeModal.dns") }}
                  </span>
                  <span class="mt-0.5 block text-xs text-gray-500">
                    {{ t("eventDetail.participation.card.dnsHint") }}
                  </span>
                </button>
                <button
                  :disabled="isSettingStatus || isClearingStatus || isCompleting"
                  class="rounded-lg border px-3 py-3 text-left transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === 'dnf'
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  "
                  @click="setParticipationStatus('dnf')"
                >
                  <span class="block text-sm font-medium text-gray-900">
                    {{ t("dashboard.completeModal.dnf") }}
                  </span>
                  <span class="mt-0.5 block text-xs text-gray-500">
                    {{ t("eventDetail.participation.card.dnfHint") }}
                  </span>
                </button>
                <button
                  :disabled="isSettingStatus || isClearingStatus || isCompleting"
                  class="rounded-lg border px-3 py-3 text-left transition-colors disabled:opacity-50"
                  :class="
                    currentParticipationStatus === 'cancelled'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  "
                  @click="setParticipationStatus('cancelled')"
                >
                  <span class="block text-sm font-medium text-gray-900">
                    {{ t("dashboard.completeModal.cancelled") }}
                  </span>
                  <span class="mt-0.5 block text-xs text-gray-500">
                    {{ t("eventDetail.participation.card.cancelledHint") }}
                  </span>
                </button>
              </div>
            </div>

            <div
              v-if="shouldShowSavedResult"
              class="mt-5 border-t border-gray-100 pt-5"
            >
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-gray-900">
                  {{ t("eventDetail.participation.card.savedResultTitle") }}
                </p>
                <button
                  class="text-xs font-medium text-orange-600 hover:text-orange-700"
                  @click="
                    modalInitialOutcome =
                      currentParticipationStatus === 'completed' ||
                      currentParticipationStatus === 'dns' ||
                      currentParticipationStatus === 'dnf' ||
                      currentParticipationStatus === 'cancelled'
                        ? currentParticipationStatus
                        : null;
                    modalEvent = buildCompleteModalEvent();
                  "
                >
                  {{ t("eventDetail.participation.card.editResult") }}
                </button>
              </div>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div
                  v-if="currentParticipationStatus === 'completed'"
                  class="border-t border-gray-100 py-3 sm:rounded-lg sm:border sm:bg-gray-50 sm:p-3"
                >
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ t("eventDetail.participation.finishTime") }}
                  </p>
                  <p class="mt-1 text-sm font-medium text-gray-900">
                    {{
                      participation?.finish_time_seconds != null
                        ? formatFinishTime(participation.finish_time_seconds)
                        : "-"
                    }}
                  </p>
                </div>
                <div
                  v-if="currentParticipationStatus === 'completed'"
                  class="border-t border-gray-100 py-3 sm:rounded-lg sm:border sm:bg-gray-50 sm:p-3"
                >
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ t("eventDetail.participation.timingUrl") }}
                  </p>
                  <a
                    v-if="participation?.timing_url"
                    :href="participation.timing_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-1 block text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    {{ t("eventDetail.participation.timingUrlLink") }}
                  </a>
                  <p v-else class="mt-1 text-sm font-medium text-gray-900">
                    -
                  </p>
                </div>
                <div
                  v-if="
                    currentParticipationStatus === 'dns' ||
                    currentParticipationStatus === 'dnf' ||
                    currentParticipationStatus === 'cancelled'
                  "
                  class="border-t border-gray-100 py-3 sm:col-span-2 sm:rounded-lg sm:border sm:bg-gray-50 sm:p-3"
                >
                  <p class="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {{ resultNotesLabel }}
                  </p>
                  <p class="mt-1 text-sm text-gray-700">
                    {{ participation?.notes || "-" }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-if="currentParticipationStatus"
              class="mt-5 border-t border-gray-100 pt-5"
            >
              <div class="mb-3">
                <p class="text-sm font-semibold text-gray-900">
                  {{ t("eventDetail.participation.card.manageTitle") }}
                </p>
              </div>
              <button
                :disabled="isSettingStatus || isClearingStatus || isCompleting"
                class="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50"
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

            <p
              v-if="participationNeedsMissingDistance"
              class="mt-4 text-sm text-orange-700"
            >
              {{ t("eventDetail.participation.missingDistance") }}
            </p>
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

      <ParticipationCompleteModal
        :event="modalEvent"
        :initial-outcome="modalInitialOutcome"
        @confirm="handleCompleteConfirm"
        @cancel="
          modalEvent = null;
          modalInitialOutcome = null;
        "
      />
    </template>
  </div>
</template>
