<script setup lang="ts">
definePageMeta({ auth: false });

const user = useSupabaseUser();
watchEffect(() => {
  setPageLayout(user.value ? "default" : "landing");
});
const isLoggedIn = computed(() => !!user.value);

const { t } = useI18n();
useHead(() => ({ title: t("page.privacy") }));

const sections = computed(() => [
  {
    key: "collected",
    title: t("privacy.sections.collected.title"),
    body: t("privacy.sections.collected.body"),
  },
  {
    key: "purpose",
    title: t("privacy.sections.purpose.title"),
    body: t("privacy.sections.purpose.body"),
  },
  {
    key: "retention",
    title: t("privacy.sections.retention.title"),
    body: t("privacy.sections.retention.body"),
  },
  {
    key: "rights",
    title: t("privacy.sections.rights.title"),
    body: t("privacy.sections.rights.body"),
  },
  {
    key: "contact",
    title: t("privacy.sections.contact.title"),
    body: t("privacy.sections.contact.body"),
  },
]);
</script>

<template>
  <div
    :class="
      isLoggedIn
        ? 'page-data-container'
        : 'page-data-container px-4 sm:px-8 py-8 sm:py-10'
    "
  >
    <h1 class="text-2xl font-bold text-gray-900 mb-1">
      {{ t("privacy.title") }}
    </h1>
    <p class="text-sm text-gray-500 mb-1">
      {{ t("privacy.subtitle") }}
    </p>
    <p class="text-xs text-gray-400 mb-8">
      {{ t("privacy.updated") }}
    </p>

    <div class="space-y-8">
      <p class="text-sm text-gray-700 leading-relaxed">
        {{ t("privacy.intro") }}
      </p>

      <section
        v-for="section in sections"
        :key="section.key"
        class="border-t border-gray-100 pt-6 first:border-t-0 first:pt-0"
      >
        <h2 class="text-sm font-semibold text-gray-900 mb-2">
          {{ section.title }}
        </h2>
        <p class="text-sm text-gray-700 leading-relaxed">
          {{ section.body }}
        </p>
      </section>
    </div>

    <div class="mt-8">
      <NuxtLink
        to="/contact"
        class="inline-flex items-center rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
      >
        {{ t("privacy.cta") }}
      </NuxtLink>
    </div>
  </div>
</template>
