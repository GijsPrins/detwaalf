<script setup lang="ts">
type AdminTab = "messages" | "slugs" | "events";

defineProps<{
  active: AdminTab;
}>();

const { t } = useI18n();

const tabs: { id: AdminTab; to: string }[] = [
  { id: "messages", to: "/admin/messages" },
  { id: "slugs", to: "/admin/slugs" },
  { id: "events", to: "/admin/events" },
];
</script>

<template>
  <div class="flex items-center gap-2 mb-4">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.to"
      class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
      :class="
        tab.id === active
          ? 'bg-orange-100 text-orange-700'
          : 'text-gray-500 hover:text-gray-900'
      "
    >
      {{ t(`admin.tabs.${tab.id}`) }}
    </NuxtLink>
  </div>
</template>
