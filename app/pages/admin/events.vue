<script setup lang="ts">
import {
  applyEventPageHints,
  createBulkEventRow,
  isBulkEventRowReady,
  normalizeEventUrl,
  parseBulkEventText,
  toEventWriteInput,
  type BulkEventRow,
} from "~/utils/bulkEventRows";
import { findPotentialDuplicateEvents } from "~/utils/eventDuplicates";

// Nominatim allows one request per second; organiser sites deserve the same.
const BATCH_DELAY_MS = 1000;

const { t } = useI18n();
useHead(() => ({ title: t("page.adminEvents") }));

const { data: canManage } = useHasRole("admin");
const { data: provinces } = useProvinces();
const { data: events } = useEventList();
const { mutateAsync: fetchHints } = useEventPageHints();
const { mutateAsync: addEvent } = useBulkAddEvent();
const { lookupProvinceId, findPlaceForEventName } = useProvinceLookup();

const rows = ref<BulkEventRow[]>([createBulkEventRow()]);
const pastedText = ref("");
const isRunningBatch = ref(false);
const promptCopied = ref(false);

const provinceOptions = computed(() => provinces.value ?? []);
const duplicateByRowKey = computed(() => {
  const existing = events.value ?? [];
  return new Map(
    rows.value.map((row) => [
      row.key,
      findPotentialDuplicateEvents(
        {
          name: row.name,
          eventDate: row.eventDate,
          provinceId: row.provinceId,
          eventUrl: normalizeEventUrl(row.eventUrl),
          location: row.location,
        },
        existing,
      )[0] ?? null,
    ]),
  );
});
const rowsToFetch = computed(() =>
  rows.value.filter(
    (row) =>
      row.status !== "saved" &&
      row.eventUrl.trim().length > 0 &&
      (!row.name || !row.eventDate || row.distances.length === 0),
  ),
);
const rowsToSave = computed(() =>
  rows.value.filter(
    (row) => isBulkEventRowReady(row) && !duplicateByRowKey.value.get(row.key),
  ),
);
const canFetchAll = computed(
  () => !isRunningBatch.value && rowsToFetch.value.length > 0,
);
const canSaveAll = computed(
  () => !isRunningBatch.value && rowsToSave.value.length > 0,
);
const savedCount = computed(
  () => rows.value.filter((row) => row.status === "saved").length,
);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findRow(key: number) {
  return rows.value.find((row) => row.key === key) ?? null;
}

function replaceRow(updated: BulkEventRow) {
  rows.value = rows.value.map((row) => (row.key === updated.key ? updated : row));
}

function patchRow(key: number, patch: Partial<BulkEventRow>) {
  const row = findRow(key);
  if (row) replaceRow({ ...row, ...patch });
}

function isPristine(row: BulkEventRow) {
  return !row.eventUrl && !row.name && !row.eventDate && !row.location;
}

function addEmptyRow() {
  rows.value = [...rows.value, createBulkEventRow()];
}

async function copyAiPrompt() {
  await navigator.clipboard.writeText(t("admin.events.aiPrompt"));
  promptCopied.value = true;
  setTimeout(() => {
    promptCopied.value = false;
  }, 2000);
}

function addPastedRows() {
  const knownUrls = new Set(rows.value.map((row) => normalizeEventUrl(row.eventUrl)));
  const newRows = parseBulkEventText(pastedText.value, provinceOptions.value).filter(
    (row) => !row.eventUrl || !knownUrls.has(row.eventUrl),
  );

  rows.value = [...rows.value.filter((row) => !isPristine(row)), ...newRows];
  if (rows.value.length === 0) addEmptyRow();
  pastedText.value = "";

  // Complete lines without a province still get the place and province lookup.
  const keysToLookUp = newRows
    .filter((row) => row.provinceId === null && (row.location || row.name))
    .map((row) => row.key);
  if (keysToLookUp.length > 0) void runForEachRow(keysToLookUp, lookupRowPlace);
}

async function lookupRowPlace(key: number) {
  await lookupProvinceForRow(key);
  await lookupPlaceForRow(key);
}

function removeRow(key: number) {
  rows.value = rows.value.filter((row) => row.key !== key);
  if (rows.value.length === 0) addEmptyRow();
}

function clearSavedRows() {
  rows.value = rows.value.filter((row) => row.status !== "saved");
  if (rows.value.length === 0) addEmptyRow();
}

async function lookupProvinceForRow(key: number) {
  const row = findRow(key);
  if (!row || row.provinceId !== null || !row.location.trim()) return;

  const provinceId = await lookupProvinceId(row.location, provinceOptions.value);
  // The admin may have picked a province while the lookup was running.
  if (provinceId !== null && findRow(key)?.provinceId === null) {
    patchRow(key, { provinceId });
  }
}

async function lookupPlaceForRow(key: number) {
  const row = findRow(key);
  if (!row || row.location.trim() || !row.name.trim()) return;

  const place = await findPlaceForEventName(row.name, provinceOptions.value);
  const latest = findRow(key);
  // Only fill what the admin has not typed while the lookup was running.
  if (!place || !latest || latest.location.trim()) return;
  patchRow(key, {
    location: place.location,
    provinceId: latest.provinceId ?? place.provinceId,
  });
}

async function fetchRowHints(key: number) {
  const row = findRow(key);
  const url = row ? normalizeEventUrl(row.eventUrl) : null;
  if (!url) {
    patchRow(key, { status: "error", errorKey: "admin.events.errors.invalidUrl" });
    return;
  }

  patchRow(key, { status: "fetching", errorKey: null });
  try {
    const hints = await fetchHints(url);
    const latest = findRow(key);
    if (!latest) return;
    replaceRow({
      ...applyEventPageHints(latest, hints),
      status: "draft",
      errorKey: hints.distances.length === 0 ? "admin.events.errors.noDistances" : null,
    });
    await lookupProvinceForRow(key);
    await lookupPlaceForRow(key);
  } catch {
    patchRow(key, { status: "error", errorKey: "admin.events.errors.fetchFailed" });
  }
}

async function saveRow(key: number) {
  const row = findRow(key);
  if (!row || !isBulkEventRowReady(row)) return;

  patchRow(key, { status: "saving", errorKey: null });
  try {
    const eventId = await addEvent(toEventWriteInput(row));
    patchRow(key, { status: "saved", savedEventId: eventId });
  } catch {
    patchRow(key, { status: "error", errorKey: "admin.events.errors.saveFailed" });
  }
}

async function runForEachRow(keys: number[], action: (key: number) => Promise<void>) {
  isRunningBatch.value = true;
  try {
    for (const [index, key] of keys.entries()) {
      if (index > 0) await wait(BATCH_DELAY_MS);
      await action(key);
    }
  } finally {
    isRunningBatch.value = false;
  }
}

function fetchAllRows() {
  return runForEachRow(rowsToFetch.value.map((row) => row.key), fetchRowHints);
}

function saveAllReadyRows() {
  return runForEachRow(rowsToSave.value.map((row) => row.key), saveRow);
}
</script>

<template>
  <div class="page-list-container">
    <div v-if="!canManage" class="text-sm text-gray-400">
      {{ t("admin.notAuthorized") }}
    </div>

    <template v-else>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-1">
          {{ t("admin.events.title") }}
        </h1>
        <p class="text-sm text-gray-500">
          {{ t("admin.events.subtitle") }}
        </p>
      </div>

      <AdminTabs active="events" />

      <div class="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <label for="paste-list" class="text-sm font-semibold text-gray-900">
          {{ t("admin.events.pasteTitle") }}
        </label>
        <p class="text-sm text-gray-500 leading-relaxed mt-1">
          {{ t("admin.events.pasteDescription") }}
        </p>
        <p class="text-xs text-gray-500 mt-1 mb-3">
          {{ t("admin.events.pasteFormat") }}
          <code class="font-mono text-gray-700">{{ t("admin.events.pasteColumns") }}</code>
        </p>
        <textarea
          id="paste-list"
          v-model="pastedText"
          rows="4"
          :placeholder="t('admin.events.pastePlaceholder')"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
        <div class="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            :disabled="!pastedText.trim() || isRunningBatch"
            class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="addPastedRows"
          >
            {{ t("admin.events.addUrls") }}
          </button>
          <button
            type="button"
            class="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            @click="copyAiPrompt"
          >
            {{ promptCopied ? t("admin.events.aiPromptCopied") : t("admin.events.copyAiPrompt") }}
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p class="text-xs text-gray-400">
          {{
            t("admin.events.summary", {
              rows: rows.length,
              ready: rowsToSave.length,
              saved: savedCount,
            })
          }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button
            v-if="savedCount > 0"
            type="button"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            @click="clearSavedRows"
          >
            {{ t("admin.events.clearSaved") }}
          </button>
          <button
            type="button"
            :disabled="!canFetchAll"
            class="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="fetchAllRows"
          >
            {{ t("admin.events.fetchAll", { count: rowsToFetch.length }) }}
          </button>
          <button
            type="button"
            :disabled="!canSaveAll"
            class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="saveAllReadyRows"
          >
            {{ t("admin.events.saveAll", { count: rowsToSave.length }) }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <EventBulkRow
          v-for="row in rows"
          :key="row.key"
          :row="row"
          :provinces="provinceOptions"
          :duplicate="duplicateByRowKey.get(row.key) ?? null"
          @update:row="replaceRow"
          @fetch="fetchRowHints(row.key)"
          @save="saveRow(row.key)"
          @remove="removeRow(row.key)"
          @lookup-province="lookupProvinceForRow(row.key)"
          @lookup-place="lookupPlaceForRow(row.key)"
        />
      </div>

      <button
        type="button"
        class="mt-4 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
        @click="addEmptyRow"
      >
        + {{ t("admin.events.addRow") }}
      </button>
    </template>
  </div>
</template>
