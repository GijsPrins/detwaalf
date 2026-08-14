<script setup lang="ts">
const { t } = useI18n();
useHead(() => ({ title: t("page.adminMessages") }));

const { data: canManage } = useCanManageEvents();
const messagesEnabled = computed(() => !!canManage.value);
const {
  data: messages,
  isPending,
  isError,
} = useContactMessages({ enabled: messagesEnabled });
const { mutate: markRead } = useMarkMessageRead();
const {
  mutateAsync: replyToMessage,
  isPending: isReplying,
  isError: replyError,
} = useReplyToContactMessage();
const replyDrafts = ref<Record<string, string>>({});
const repliedMessageId = ref<string | null>(null);

const unreadCount = computed(
  () => (messages.value ?? []).filter((m) => !m.read_at).length,
);

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function sortedReplies(
  replies: NonNullable<typeof messages.value>[number]["contact_message_replies"],
) {
  return [...replies].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

async function submitReply(messageId: string) {
  const body = replyDrafts.value[messageId]?.trim();
  if (!body) return;

  await replyToMessage({ contactMessageId: messageId, body });
  replyDrafts.value[messageId] = "";
  repliedMessageId.value = messageId;
}
</script>

<template>
  <div class="page-list-container">
    <div v-if="!canManage" class="text-sm text-gray-400">
      {{ t("admin.notAuthorized") }}
    </div>

    <template v-else>
      <div class="flex items-center gap-2 mb-4">
        <NuxtLink
          to="/admin/messages"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-orange-100 text-orange-700"
        >
          {{ t("admin.tabs.messages") }}
        </NuxtLink>
        <NuxtLink
          to="/admin/slugs"
          class="px-3 py-1 rounded-full text-xs font-medium transition-colors text-gray-500 hover:text-gray-900"
        >
          {{ t("admin.tabs.slugs") }}
        </NuxtLink>
      </div>

      <div class="flex items-baseline justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">
            {{ t("admin.messages.title") }}
          </h1>
          <p v-if="unreadCount > 0" class="text-sm text-orange-600">
            {{ t("admin.messages.unread", { count: unreadCount }) }}
          </p>
          <p v-else class="text-sm text-gray-400">
            {{ t("admin.messages.allRead") }}
          </p>
        </div>
      </div>

      <p v-if="isPending" class="text-sm text-gray-400">
        {{ t("admin.messages.loading") }}
      </p>

      <p v-else-if="isError" class="text-sm text-red-600">
        {{ t("admin.messages.error") }}
      </p>

      <p v-else-if="!messages?.length" class="text-sm text-gray-400">
        {{ t("admin.messages.empty") }}
      </p>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="bg-white rounded-xl border p-5 transition-colors"
          :class="msg.read_at ? 'border-gray-100' : 'border-orange-200'"
        >
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="{
                  'bg-gray-100 text-gray-600': msg.type === 'general',
                  'bg-blue-100 text-blue-700': msg.type === 'data_request',
                  'bg-red-100 text-red-700': msg.type === 'delete_account',
                }"
              >
                {{ t(`contact.type.${msg.type}`) }}
              </span>
              <span class="text-xs text-gray-400">{{ msg.email }}</span>
            </div>
            <span class="text-xs text-gray-400 shrink-0">{{
              formatDate(msg.created_at)
            }}</span>
          </div>

          <p class="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
            {{ msg.message }}
          </p>

          <div
            v-if="msg.contact_message_replies.length"
            class="mt-4 border-t border-gray-100 pt-4 space-y-3"
          >
            <div
              v-for="reply in sortedReplies(msg.contact_message_replies)"
              :key="reply.id"
              class="rounded-lg bg-gray-50 px-3 py-2"
            >
              <div class="mb-1 text-xs text-gray-400">
                {{ t("admin.messages.replyFromAdmin") }} ·
                {{ formatDate(reply.created_at) }}
              </div>
              <p class="text-sm text-gray-700 whitespace-pre-wrap">
                {{ reply.body }}
              </p>
            </div>
          </div>

          <form class="mt-4 flex flex-col gap-2" @submit.prevent="submitReply(msg.id)">
            <label :for="`reply-${msg.id}`" class="text-xs font-medium text-gray-500">
              {{ t("admin.messages.replyLabel") }}
            </label>
            <textarea
              :id="`reply-${msg.id}`"
              v-model="replyDrafts[msg.id]"
              maxlength="2000"
              rows="3"
              class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
              :placeholder="t('admin.messages.replyPlaceholder')"
            />
            <div class="flex items-center justify-between gap-3">
              <p v-if="replyError" class="text-xs text-red-600">
                {{ t("admin.messages.replyError") }}
              </p>
              <p
                v-else-if="repliedMessageId === msg.id"
                class="text-xs text-green-700"
              >
                {{ t("admin.messages.replySent") }}
              </p>
              <span v-else />
              <button
                type="submit"
                :disabled="!replyDrafts[msg.id]?.trim() || isReplying"
                class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{
                  isReplying
                    ? t("admin.messages.replySending")
                    : t("admin.messages.replySubmit")
                }}
              </button>
            </div>
          </form>

          <div class="mt-4 flex items-center justify-between">
            <span v-if="msg.read_at" class="text-xs text-gray-400">
              {{
                t("admin.messages.readOn", { date: formatDate(msg.read_at) })
              }}
            </span>
            <button
              v-else
              class="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
              @click="markRead(msg.id)"
            >
              {{ t("admin.messages.markRead") }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
