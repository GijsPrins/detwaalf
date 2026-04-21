<script setup lang="ts">
export interface CompleteModalEvent {
  eventId: string;
  eventDistanceId: string | null;
  eventName: string;
  province: string;
  distance: string;
}

export interface CompleteModalResult {
  status: "completed" | "dns" | "dnf";
  finishTimeSeconds: number | null;
  timingUrl: string | null;
  notes: string | null;
}

type Outcome = CompleteModalResult["status"];

const props = defineProps<{ event: CompleteModalEvent | null }>();

const emit = defineEmits<{
  confirm: [result: CompleteModalResult];
  cancel: [];
}>();

const { t } = useI18n();

const outcome = ref<Outcome | null>(null);
const finishTimeInput = ref("");
const timingUrl = ref("");
const notes = ref("");
const timeError = ref<string | null>(null);

watch(
  () => props.event,
  () => {
    outcome.value = null;
    finishTimeInput.value = "";
    timingUrl.value = "";
    notes.value = "";
    timeError.value = null;
  },
);

const outcomeLabels = computed<Record<Outcome, string>>(() => ({
  completed: t("dashboard.completeModal.finished"),
  dns: t("dashboard.completeModal.dns"),
  dnf: t("dashboard.completeModal.dnf"),
}));

const canConfirm = computed(() => outcome.value !== null);

function parseFinishTime(input: string): number | null {
  const parts = input.trim().split(":").map(Number);
  if (parts.some((n) => isNaN(n) || n < 0)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function handleConfirm() {
  if (!canConfirm.value) return;

  let finishTimeSeconds: number | null = null;
  if (outcome.value === "completed" && finishTimeInput.value.trim()) {
    finishTimeSeconds = parseFinishTime(finishTimeInput.value);
    if (finishTimeSeconds === null) {
      timeError.value = t("dashboard.completeModal.invalidTime");
      return;
    }
  }
  timeError.value = null;

  emit("confirm", {
    status: outcome.value!,
    finishTimeSeconds,
    timingUrl: timingUrl.value.trim() || null,
    notes: notes.value.trim() || null,
  });
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="event"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-xs font-bold tracking-widest text-orange-600 uppercase mb-1">
              {{ t("dashboard.completeModal.label") }}
            </p>
            <p class="text-lg font-bold text-gray-900">{{ event.eventName }}</p>
            <p class="text-sm text-gray-400">
              {{ event.province
              }}<template v-if="event.distance"> · {{ event.distance }}</template>
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-600 transition-colors ml-4 text-xl leading-none mt-0.5"
            @click="$emit('cancel')"
          >
            ×
          </button>
        </div>

        <!-- Outcome selection -->
        <p class="text-sm font-medium text-gray-700 mb-3">
          {{ t("dashboard.completeModal.how") }}
        </p>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button
            v-for="opt in (['completed', 'dns', 'dnf'] as Outcome[])"
            :key="opt"
            class="py-2 rounded-lg text-sm font-medium border transition-colors"
            :class="
              outcome === opt
                ? opt === 'completed'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-400 bg-gray-50 text-gray-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            "
            @click="outcome = opt"
          >
            {{ outcomeLabels[opt] }}
          </button>
        </div>

        <!-- Extra fields when finished -->
        <template v-if="outcome === 'completed'">
          <div class="mb-3">
            <label class="text-xs text-gray-700 mb-1 block">
              {{ t("dashboard.completeModal.finishTime") }}
              <span class="text-gray-400">
                {{ t("dashboard.completeModal.optional") }}</span
              >
            </label>
            <input
              v-model="finishTimeInput"
              type="text"
              :placeholder="t('dashboard.completeModal.finishTimePlaceholder')"
              class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              :class="timeError ? 'border-red-300' : 'border-gray-200'"
            />
            <p v-if="timeError" class="text-xs text-red-500 mt-1">
              {{ timeError }}
            </p>
          </div>
          <div class="mb-4">
            <label class="text-xs text-gray-700 mb-1 block">
              {{ t("dashboard.completeModal.timingUrl") }}
              <span class="text-gray-400">
                {{ t("dashboard.completeModal.optional") }}</span
              >
            </label>
            <input
              v-model="timingUrl"
              type="url"
              :placeholder="t('dashboard.completeModal.timingUrlPlaceholder')"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors"
            />
          </div>
        </template>

        <!-- Notes for DNS/DNF -->
        <template v-if="outcome === 'dns' || outcome === 'dnf'">
          <div class="mb-4">
            <label class="text-xs text-gray-700 mb-1 block">
              {{ t("dashboard.completeModal.notes") }}
              <span class="text-gray-400">
                {{ t("dashboard.completeModal.optional") }}</span
              >
            </label>
            <textarea
              v-model="notes"
              rows="2"
              :placeholder="t('dashboard.completeModal.notesPlaceholder')"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors resize-none"
            />
          </div>
        </template>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            class="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
            :class="
              canConfirm
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-orange-200 text-white cursor-not-allowed'
            "
            :disabled="!canConfirm"
            @click="handleConfirm"
          >
            {{ t("dashboard.completeModal.confirm") }}
          </button>
          <button
            class="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
            @click="$emit('cancel')"
          >
            {{ t("dashboard.completeModal.cancel") }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
