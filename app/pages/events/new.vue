<script setup lang="ts">
import {
  createEmptyEventDistanceInput,
  hasDuplicateEventDistances,
  normalizeEventDistanceInputs,
} from "~/utils/eventDistances";
import { findPotentialDuplicateEvents } from "~/utils/eventDuplicates";
import { formatEventDate } from "~/mappers/events";

definePageMeta({ layout: "default" });

const { t } = useI18n();
useHead(() => ({ title: t("eventForm.titleAdd") }));

const { data: provinces } = useProvinces();
const { data: events } = useEventList();
const { data: canEditEvents } = useCanManageEvents();
const { mutate, isPending, isError } = useAddEvent();

const form = reactive({
  name: "",
  eventDate: "",
  distances: [createEmptyEventDistanceInput()],
  location: "",
  provinceId: null as number | null,
  eventUrl: "",
  registrationUrl: "",
  registrationOpens: "",
  registrationDeadline: "",
});

const provinceAutoFilled = ref(false);
const nominatimLoading = ref(false);
const normalizedDistances = computed(() =>
  normalizeEventDistanceInputs(form.distances),
);
const hasDuplicateDistances = computed(() =>
  hasDuplicateEventDistances(form.distances),
);
const duplicateMatches = computed(() =>
  findPotentialDuplicateEvents(
    {
      name: form.name,
      eventDate: form.eventDate,
      provinceId: form.provinceId,
      eventUrl: form.eventUrl,
      location: form.location,
    },
    events.value ?? [],
  ),
);
const likelyDuplicate = computed(() => duplicateMatches.value[0] ?? null);
const hasPotentialDuplicate = computed(() => duplicateMatches.value.length > 0);

const canSubmit = computed(
  () =>
    form.name.trim() &&
    form.eventDate &&
    normalizedDistances.value.length > 0 &&
    !hasDuplicateDistances.value &&
    form.provinceId !== null &&
    !isPending.value,
);

async function lookupProvince() {
  if (!form.location.trim() || !provinces.value?.length) return;

  nominatimLoading.value = true;
  provinceAutoFilled.value = false;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.location)}&countrycodes=nl&format=json&addressdetails=1&limit=1&accept-language=nl`,
      {
        headers: {
          "User-Agent": "TwaalfProvincies/1.0 (twaalfprovincies.run)",
        },
      },
    );
    const results: { address?: { state?: string } }[] = await res.json();
    const stateName = results[0]?.address?.state;
    if (!stateName) return;

    const match = provinces.value.find(
      (p) =>
        p.name.toLowerCase() === stateName.toLowerCase() ||
        (p.name === "Friesland" && stateName === "Fryslân"),
    );

    if (match) {
      form.provinceId = match.id;
      provinceAutoFilled.value = true;
    }
  } catch {
    // Silent fail — user can select manually
  } finally {
    nominatimLoading.value = false;
  }
}

function submit() {
  if (!canSubmit.value) return;
  mutate({
    name: form.name.trim(),
    event_date: form.eventDate,
    distances: normalizedDistances.value,
    province_id: form.provinceId!,
    location: form.location.trim() || null,
    event_url: form.eventUrl.trim() || null,
    registration_url: form.registrationUrl.trim() || null,
    registration_opens: form.registrationOpens || null,
    registration_deadline: form.registrationDeadline || null,
  });
}
</script>

<template>
  <div class="page-data-container">
    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">
      {{ t("eventForm.titleAdd") }}
    </h1>

    <form class="flex flex-col gap-5" @submit.prevent="submit">
      <!-- Naam -->
      <div class="flex flex-col gap-1.5">
        <label for="name" class="text-sm font-medium text-gray-700">
          {{ t("eventForm.fields.name") }}
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <!-- Datum -->
      <div class="flex flex-col gap-1.5">
        <label for="eventDate" class="text-sm font-medium text-gray-700">
          {{ t("eventForm.fields.date") }}
        </label>
        <input
          id="eventDate"
          v-model="form.eventDate"
          type="date"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <!-- Locatie -->
      <div class="flex flex-col gap-1.5">
        <label for="location" class="text-sm font-medium text-gray-700">
          {{ t("eventForm.fields.location") }}
          <span class="text-gray-400 font-normal">{{
            t("eventForm.fields.optional")
          }}</span>
        </label>
        <input
          id="location"
          v-model="form.location"
          type="text"
          :placeholder="t('eventForm.fields.locationPlaceholder')"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          @blur="lookupProvince"
        />
      </div>

      <!-- Provincie -->
      <div class="flex flex-col gap-1.5">
        <label for="province" class="text-sm font-medium text-gray-700">
          {{ t("eventForm.fields.province") }}
        </label>
        <select
          id="province"
          v-model="form.provinceId"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white"
          :disabled="nominatimLoading"
        >
          <option :value="null" disabled>
            {{ t("eventForm.fields.provincePlaceholder") }}
          </option>
          <option
            v-for="province in provinces"
            :key="province.id"
            :value="province.id"
          >
            {{ province.name }}
          </option>
        </select>
        <p v-if="provinceAutoFilled" class="text-xs text-orange-600">
          {{ t("eventForm.provinceAutoFilled") }}
        </p>
      </div>

      <div
        v-if="likelyDuplicate"
        class="rounded-xl border border-orange-200 bg-orange-50 p-4"
      >
        <p class="text-sm font-semibold text-orange-900">
          {{ t("eventForm.duplicate.title") }}
        </p>
        <p class="mt-1 text-sm text-orange-800">
          {{ t("eventForm.duplicate.description") }}
        </p>

        <div class="mt-4 rounded-lg border border-orange-100 bg-white p-3">
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-gray-900">
                {{ likelyDuplicate.event.name }}
              </p>
              <p class="mt-1 text-xs text-gray-500">
                {{ formatEventDate(likelyDuplicate.event.event_date) }}
                <template v-if="likelyDuplicate.event.province?.name">
                  &middot; {{ likelyDuplicate.event.province.name }}
                </template>
                <template v-if="likelyDuplicate.event.location">
                  &middot; {{ likelyDuplicate.event.location }}
                </template>
              </p>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2">
              <NuxtLink
                :to="`/events/${likelyDuplicate.event.id}?tab=participation`"
                class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-orange-700"
              >
                {{ t("eventForm.duplicate.participation") }}
              </NuxtLink>
              <NuxtLink
                v-if="canEditEvents"
                :to="`/events/${likelyDuplicate.event.id}/edit`"
                class="inline-flex items-center justify-center rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
              >
                {{ t("eventForm.duplicate.edit") }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-if="duplicateMatches.length > 1" class="mt-3">
          <p class="text-xs font-medium text-orange-900">
            {{ t("eventForm.duplicate.otherMatches") }}
          </p>
          <div class="mt-2 flex flex-col gap-1">
            <NuxtLink
              v-for="match in duplicateMatches.slice(1)"
              :key="match.event.id"
              :to="`/events/${match.event.id}`"
              class="text-xs text-orange-700 transition-colors hover:text-orange-900"
            >
              {{ match.event.name }} &middot;
              {{ formatEventDate(match.event.event_date) }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Afstanden -->
      <div class="flex flex-col gap-2">
        <EventDistanceFields v-model="form.distances" :disabled="isPending" />
        <p v-if="hasDuplicateDistances" class="text-xs text-red-600">
          {{ t("eventForm.errors.duplicateDistances") }}
        </p>
      </div>

      <!-- Website -->
      <div class="flex flex-col gap-1.5">
        <label for="eventUrl" class="text-sm font-medium text-gray-700">
          {{ t("eventForm.fields.eventUrl") }}
          <span class="text-gray-400 font-normal">{{
            t("eventForm.fields.optional")
          }}</span>
        </label>
        <input
          id="eventUrl"
          v-model="form.eventUrl"
          type="url"
          :placeholder="t('eventForm.fields.eventUrlPlaceholder')"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <!-- Inschrijflink -->
      <div class="flex flex-col gap-1.5">
        <label for="registrationUrl" class="text-sm font-medium text-gray-700">
          {{ t("eventForm.fields.registrationUrl") }}
          <span class="text-gray-400 font-normal">{{
            t("eventForm.fields.optional")
          }}</span>
        </label>
        <input
          id="registrationUrl"
          v-model="form.registrationUrl"
          type="url"
          :placeholder="t('eventForm.fields.registrationUrlPlaceholder')"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      <!-- Inschrijving opent + deadline -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label
            for="registrationOpens"
            class="text-sm font-medium text-gray-700"
          >
            {{ t("eventForm.fields.registrationOpens") }}
            <span class="text-gray-400 font-normal">{{
              t("eventForm.fields.optional")
            }}</span>
          </label>
          <input
            id="registrationOpens"
            v-model="form.registrationOpens"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label
            for="registrationDeadline"
            class="text-sm font-medium text-gray-700"
          >
            {{ t("eventForm.fields.registrationDeadline") }}
            <span class="text-gray-400 font-normal">{{
              t("eventForm.fields.optional")
            }}</span>
          </label>
          <input
            id="registrationDeadline"
            v-model="form.registrationDeadline"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      <!-- Hint + error -->
      <p class="text-xs text-orange-600">
        {{ t("eventForm.hint") }}
      </p>

      <p v-if="isError" class="text-sm text-red-600">
        {{ t("eventForm.errors.generic") }}
      </p>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-1">
        <button
          type="submit"
          :disabled="!canSubmit"
          class="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{
            isPending
              ? "…"
              : hasPotentialDuplicate
                ? t("eventForm.submitAnyway")
                : t("eventForm.submit")
          }}
        </button>
        <NuxtLink
          to="/events"
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          {{ t("eventForm.cancel") }}
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
