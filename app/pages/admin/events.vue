<script setup lang="ts">
import {
  applyEventPageHints,
  createBulkEventRow,
  isBulkEventRowReady,
  normalizeEventUrl,
  parseEventUrlList,
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
const { lookupProvinceId } = useProvinceLookup();

const rows = ref<BulkEventRow[]>([createBulkEventRow()]);
const urlListText = ref("");
const isRunningBatch = ref(false);

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

function addUrlRows() {
  const knownUrls = new Set(rows.value.map((row) => normalizeEventUrl(row.eventUrl)));
  const newRows = parseEventUrlList(urlListText.value)
    .filter((url) => !knownUrls.has(url))
    .map((url) => createBulkEventRow(url));

  rows.value = [...rows.value.filter((row) => !isPristine(row)), ...newRows];
  if (rows.value.length === 0) addEmptyRow();
  urlListText.value = "";
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
        <label for="url-list" class="text-sm font-semibold text-gray-900">
          {{ t("admin.events.pasteTitle") }}
        </label>
        <p class="text-sm text-gray-500 leading-relaxed mt-1 mb-3">
          {{ t("admin.events.pasteDescription") }}
        </p>
        <textarea
          id="url-list"
          v-model="urlListText"
          rows="4"
          :placeholder="t('admin.events.pastePlaceholder')"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
        <button
          type="button"
          :disabled="!urlListText.trim()"
          class="mt-3 inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="addUrlRows"
        >
          {{ t("admin.events.addUrls") }}
        </button>
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
