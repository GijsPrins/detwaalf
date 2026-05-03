<script setup lang="ts">
import type { SlugWordRow, SlugWordType } from "~/queries/slugWords";

type BulkDelimiter = "newline" | "comma" | "semicolon" | "pipe";

const { t } = useI18n();
useHead(() => ({ title: t("page.adminSlugs") }));

const { data: canManage } = useCanManageEvents();
const slugWordsEnabled = computed(() => !!canManage.value);
const {
  data: words,
  isPending,
  isError,
  error,
} = useSlugWords({ enabled: slugWordsEnabled });

const { mutateAsync: addSlugWord, isPending: isAdding } = useAddSlugWord();
const { mutateAsync: bulkAddSlugWords, isPending: isBulkAdding } =
  useBulkAddSlugWords();
const { mutateAsync: updateSlugWord, isPending: isSaving } =
  useUpdateSlugWord();
const { mutateAsync: removeSlugWord, isPending: isRemoving } =
  useDeleteSlugWord();

const addForm = reactive<{ locale: string; type: SlugWordType; word: string }>({
  locale: "nl",
  type: "adjective",
  word: "",
});

const bulkForm = reactive<{
  locale: string;
  type: SlugWordType;
  delimiter: BulkDelimiter;
  wordsText: string;
}>({
  locale: "nl",
  type: "adjective",
  delimiter: "newline",
  wordsText: "",
});

const editingId = ref<number | null>(null);
const editForm = reactive<{
  locale: string;
  type: SlugWordType;
  word: string;
  active: boolean;
}>({
  locale: "nl",
  type: "adjective",
  word: "",
  active: true,
});

const submitError = ref<string | null>(null);
const bulkFeedback = ref<string | null>(null);
const searchQuery = ref("");

const sortedWords = computed(() => words.value ?? []);
const normalizedSearchQuery = computed(() =>
  searchQuery.value.trim().toLowerCase(),
);
const filteredWords = computed(() => {
  const query = normalizedSearchQuery.value;
  if (!query) return sortedWords.value;

  return sortedWords.value.filter((item) => {
    return (
      item.word.toLowerCase().includes(query) ||
      item.locale.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );
  });
});
const isMutating = computed(
  () =>
    isAdding.value || isBulkAdding.value || isSaving.value || isRemoving.value,
);

function cleanWord(word: string) {
  return word.trim().toLowerCase();
}

async function submitAdd() {
  submitError.value = null;
  bulkFeedback.value = null;
  const word = cleanWord(addForm.word);
  if (!word) return;

  try {
    await addSlugWord({
      locale: addForm.locale.trim().toLowerCase(),
      type: addForm.type,
      word,
      active: true,
    });
    addForm.word = "";
  } catch (e) {
    submitError.value =
      (e as { message?: string })?.message ?? t("admin.slugs.saveError");
  }
}

function parseBulkWords(wordsText: string, delimiter: BulkDelimiter): string[] {
  const splitPattern: RegExp = {
    newline: /\r?\n/,
    comma: /,/,
    semicolon: /;/,
    pipe: /\|/,
  }[delimiter];

  const uniqueWords = new Set<string>();

  for (const chunk of wordsText.split(splitPattern)) {
    const word = cleanWord(chunk);
    if (!word) continue;
    uniqueWords.add(word);
  }

  return [...uniqueWords];
}

async function submitBulkAdd() {
  submitError.value = null;
  bulkFeedback.value = null;

  const words = parseBulkWords(bulkForm.wordsText, bulkForm.delimiter);
  if (!words.length) {
    submitError.value = t("admin.slugs.bulkNoWords");
    return;
  }

  try {
    await bulkAddSlugWords({
      locale: bulkForm.locale.trim().toLowerCase(),
      type: bulkForm.type,
      words,
      active: true,
    });
    bulkForm.wordsText = "";
    bulkFeedback.value = t("admin.slugs.bulkSuccess", { count: words.length });
  } catch (e) {
    submitError.value =
      (e as { message?: string })?.message ?? t("admin.slugs.saveError");
  }
}

function startEdit(item: SlugWordRow) {
  editingId.value = item.id;
  editForm.locale = item.locale;
  editForm.type = item.type;
  editForm.word = item.word;
  editForm.active = item.active;
  submitError.value = null;
  bulkFeedback.value = null;
}

function cancelEdit() {
  editingId.value = null;
}

async function saveEdit(id: number) {
  submitError.value = null;
  bulkFeedback.value = null;
  const word = cleanWord(editForm.word);
  if (!word) return;

  try {
    await updateSlugWord({
      id,
      locale: editForm.locale.trim().toLowerCase(),
      type: editForm.type,
      word,
      active: editForm.active,
    });
    editingId.value = null;
  } catch (e) {
    submitError.value =
      (e as { message?: string })?.message ?? t("admin.slugs.saveError");
  }
}

async function toggleActive(item: SlugWordRow) {
  submitError.value = null;
  bulkFeedback.value = null;

  try {
    await updateSlugWord({
      id: item.id,
      locale: item.locale,
      type: item.type,
      word: item.word,
      active: !item.active,
    });

    if (editingId.value === item.id) {
      editingId.value = null;
    }
  } catch (e) {
    submitError.value =
      (e as { message?: string })?.message ?? t("admin.slugs.saveError");
  }
}

async function removeWord(item: SlugWordRow) {
  const confirmed = window.confirm(
    t("admin.slugs.deleteConfirm", { word: item.word }),
  );
  if (!confirmed) return;

  submitError.value = null;
  bulkFeedback.value = null;

  try {
    await removeSlugWord(item.id);
    if (editingId.value === item.id) {
      editingId.value = null;
    }
  } catch (e) {
    submitError.value =
      (e as { message?: string })?.message ?? t("admin.slugs.saveError");
  }
}
</script>

<template>
  <div class="page-list-container">
    <div v-if="!canManage" class="text-sm text-gray-400">
      {{ t("admin.notAuthorized") }}
    </div>

    <template v-else>
      <div class="flex items-baseline justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">
            {{ t("admin.slugs.title") }}
          </h1>
          <p class="text-sm text-gray-500">
            {{ t("admin.slugs.subtitle") }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 mb-4">
        <NuxtLink
          to="/admin/messages"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors text-gray-500 hover:text-gray-900"
        >
          {{ t("admin.tabs.messages") }}
        </NuxtLink>
        <NuxtLink
          to="/admin/slugs"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-orange-100 text-orange-700"
        >
          {{ t("admin.tabs.slugs") }}
        </NuxtLink>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <p class="text-sm font-semibold text-gray-900 mb-4">
          {{ t("admin.slugs.addTitle") }}
        </p>
        <form
          class="grid grid-cols-1 sm:grid-cols-4 gap-3"
          @submit.prevent="submitAdd"
        >
          <label class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">{{
              t("admin.slugs.fields.locale")
            }}</span>
            <input
              v-model="addForm.locale"
              type="text"
              class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
              :placeholder="t('admin.slugs.localePlaceholder')"
              maxlength="8"
              required
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">{{
              t("admin.slugs.fields.type")
            }}</span>
            <select
              v-model="addForm.type"
              class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            >
              <option value="adjective">
                {{ t("admin.slugs.types.adjective") }}
              </option>
              <option value="noun">{{ t("admin.slugs.types.noun") }}</option>
            </select>
          </label>

          <label class="sm:col-span-2 flex flex-col gap-1">
            <span class="text-xs text-gray-500">{{
              t("admin.slugs.fields.word")
            }}</span>
            <div class="flex items-center gap-2">
              <input
                v-model="addForm.word"
                type="text"
                class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                :placeholder="t('admin.slugs.wordPlaceholder')"
                maxlength="64"
                required
              />
              <button
                type="submit"
                class="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
                :disabled="isAdding"
              >
                {{ isAdding ? t("admin.slugs.saving") : t("admin.slugs.add") }}
              </button>
            </div>
          </label>
        </form>
      </div>

      <div class="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <p class="text-sm font-semibold text-gray-900 mb-1">
          {{ t("admin.slugs.bulkTitle") }}
        </p>
        <p class="text-sm text-gray-500 mb-4">
          {{ t("admin.slugs.bulkDescription") }}
        </p>

        <form
          class="grid grid-cols-1 sm:grid-cols-4 gap-3"
          @submit.prevent="submitBulkAdd"
        >
          <label class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">{{
              t("admin.slugs.fields.locale")
            }}</span>
            <input
              v-model="bulkForm.locale"
              type="text"
              class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
              :placeholder="t('admin.slugs.localePlaceholder')"
              maxlength="8"
              required
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-xs text-gray-500">{{
              t("admin.slugs.fields.type")
            }}</span>
            <select
              v-model="bulkForm.type"
              class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            >
              <option value="adjective">
                {{ t("admin.slugs.types.adjective") }}
              </option>
              <option value="noun">{{ t("admin.slugs.types.noun") }}</option>
            </select>
          </label>

          <label class="sm:col-span-2 flex flex-col gap-1">
            <span class="text-xs text-gray-500">{{
              t("admin.slugs.bulkDelimiter")
            }}</span>
            <select
              v-model="bulkForm.delimiter"
              class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            >
              <option value="newline">
                {{ t("admin.slugs.delimiters.newline") }}
              </option>
              <option value="comma">
                {{ t("admin.slugs.delimiters.comma") }}
              </option>
              <option value="semicolon">
                {{ t("admin.slugs.delimiters.semicolon") }}
              </option>
              <option value="pipe">
                {{ t("admin.slugs.delimiters.pipe") }}
              </option>
            </select>
          </label>

          <label class="sm:col-span-4 flex flex-col gap-1">
            <span class="text-xs text-gray-500">{{
              t("admin.slugs.bulkWords")
            }}</span>
            <textarea
              v-model="bulkForm.wordsText"
              rows="6"
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
              :placeholder="t('admin.slugs.bulkWordsPlaceholder')"
              required
            />
          </label>

          <div class="sm:col-span-4 flex justify-end">
            <button
              type="submit"
              class="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50"
              :disabled="isBulkAdding"
            >
              {{
                isBulkAdding
                  ? t("admin.slugs.bulkAdding")
                  : t("admin.slugs.bulkAdd")
              }}
            </button>
          </div>
        </form>
      </div>

      <p v-if="isPending" class="text-sm text-gray-400">
        {{ t("admin.slugs.loading") }}
      </p>

      <p v-else-if="isError" class="text-sm text-red-600">
        {{ error?.message || t("admin.slugs.error") }}
      </p>

      <p v-else-if="!sortedWords.length" class="text-sm text-gray-400">
        {{ t("admin.slugs.empty") }}
      </p>

      <div v-else class="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <label class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">{{
            t("admin.slugs.searchLabel")
          }}</span>
          <input
            v-model="searchQuery"
            type="text"
            class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            :placeholder="t('admin.slugs.searchPlaceholder')"
          />
        </label>
      </div>

      <p v-if="!filteredWords.length" class="text-sm text-gray-400">
        {{ t("admin.slugs.noSearchResults") }}
      </p>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="item in filteredWords"
          :key="item.id"
          class="bg-white rounded-xl border border-gray-100 p-5"
          :class="item.active ? '' : 'opacity-75'"
        >
          <div
            class="grid grid-cols-1 sm:grid-cols-[120px_140px_1fr_auto] gap-3 items-center"
          >
            <template v-if="editingId === item.id">
              <input
                v-model="editForm.locale"
                type="text"
                class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                maxlength="8"
              />

              <select
                v-model="editForm.type"
                class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
              >
                <option value="adjective">
                  {{ t("admin.slugs.types.adjective") }}
                </option>
                <option value="noun">{{ t("admin.slugs.types.noun") }}</option>
              </select>

              <input
                v-model="editForm.word"
                type="text"
                class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                maxlength="64"
              />

              <label
                class="inline-flex items-center gap-2 text-xs text-gray-600"
              >
                <input v-model="editForm.active" type="checkbox" />
                {{ t("admin.slugs.fields.active") }}
              </label>
            </template>

            <template v-else>
              <span class="text-xs text-gray-500">{{ item.locale }}</span>
              <span class="text-xs text-gray-500">{{
                t(`admin.slugs.types.${item.type}`)
              }}</span>
              <p class="text-sm font-medium text-gray-900">{{ item.word }}</p>
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full justify-self-start"
                :class="
                  item.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{
                  item.active
                    ? t("admin.slugs.active")
                    : t("admin.slugs.inactive")
                }}
              </span>
            </template>
          </div>

          <div class="mt-4 flex items-center justify-end gap-2">
            <template v-if="editingId === item.id">
              <button
                class="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                :disabled="isMutating"
                @click="cancelEdit"
              >
                {{ t("admin.slugs.cancel") }}
              </button>
              <button
                class="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors disabled:opacity-50"
                :disabled="isMutating"
                @click="saveEdit(item.id)"
              >
                {{ t("admin.slugs.save") }}
              </button>
            </template>

            <template v-else>
              <button
                class="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                :disabled="isMutating"
                @click="startEdit(item)"
              >
                {{ t("admin.slugs.edit") }}
              </button>
              <button
                class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                :class="
                  item.active
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                "
                :disabled="isMutating"
                @click="toggleActive(item)"
              >
                {{
                  item.active
                    ? t("admin.slugs.deactivate")
                    : t("admin.slugs.activate")
                }}
              </button>
              <button
                class="px-3 py-1 rounded-full text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                :disabled="isMutating"
                @click="removeWord(item)"
              >
                {{ t("admin.slugs.delete") }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <p v-if="submitError" class="mt-4 text-sm text-red-600">
        {{ submitError }}
      </p>
      <p v-else-if="bulkFeedback" class="mt-4 text-sm text-green-700">
        {{ bulkFeedback }}
      </p>
    </template>
  </div>
</template>
