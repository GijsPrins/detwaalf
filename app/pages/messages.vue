<script setup lang="ts">
const { t } = useI18n();
useHead(() => ({ title: t("page.messages") }));

const {
  data: messages,
  isPending,
  isError,
} = useOwnContactMessages();
const { mutate: markViewed } = useMarkOwnContactMessagesViewed();

watch(
  () => messages.value,
  (value) => {
    if (value?.length) {
      markViewed();
    }
  },
  { immediate: true },
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
</script>

<template>
  <div class="page-data-container">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-1">
        {{ t("messages.title") }}
      </h1>
      <p class="text-sm text-gray-500">
        {{ t("messages.subtitle") }}
      </p>
    </div>

    <p v-if="isPending" class="text-sm text-gray-400">
      {{ t("messages.loading") }}
    </p>

    <p v-else-if="isError" class="text-sm text-red-600">
      {{ t("messages.error") }}
    </p>

    <div v-else-if="!messages?.length" class="space-y-4">
      <p class="text-sm text-gray-400">
        {{ t("messages.empty") }}
      </p>
      <NuxtLink
        to="/contact"
        class="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        {{ t("messages.newMessage") }}
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col gap-3">
      <article
        v-for="msg in messages"
        :key="msg.id"
        class="rounded-xl border border-gray-100 bg-white p-4"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <span class="text-xs font-medium text-orange-600">
            {{ t(`contact.type.${msg.type}`) }}
          </span>
          <span class="text-xs text-gray-400 shrink-0">
            {{ formatDate(msg.created_at) }}
          </span>
        </div>
        <p class="text-sm text-gray-700 whitespace-pre-wrap">
          {{ msg.message }}
        </p>

        <div
          v-if="msg.contact_message_replies.length"
          class="mt-4 space-y-3 border-t border-gray-100 pt-4"
        >
          <div
            v-for="reply in sortedReplies(msg.contact_message_replies)"
            :key="reply.id"
            class="rounded-lg bg-gray-50 px-3 py-2"
          >
            <div class="mb-1 text-xs text-gray-400">
              {{ t("messages.replyLabel") }} ·
              {{ formatDate(reply.created_at) }}
            </div>
            <p class="text-sm text-gray-900 whitespace-pre-wrap">
              {{ reply.body }}
            </p>
          </div>
        </div>

        <p v-else class="mt-4 text-xs text-gray-400">
          {{ t("messages.noReply") }}
        </p>
      </article>

      <NuxtLink
        to="/contact"
        class="mt-2 inline-flex items-center justify-center self-start rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        {{ t("messages.newMessage") }}
      </NuxtLink>
    </div>
  </div>
</template>
