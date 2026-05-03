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
