<script setup lang="ts">
const { t } = useI18n();
const user = useSupabaseUser();
const supabase = useSupabaseClient();
const route = useRoute();

const mobileMenuOpen = ref(false);
watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);

const { data: canManage } = useCanManageEvents();
const adminUnreadEnabled = computed(() => !!canManage.value);
const { data: unreadMessageCount } = useUnreadContactMessagesCount({
  enabled: adminUnreadEnabled,
});
const hasUnreadAdminMessages = computed(
  () => (unreadMessageCount.value ?? 0) > 0,
);

async function logout() {
  mobileMenuOpen.value = false;
  await supabase.auth.signOut();
  navigateTo("/");
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <nav
      class="bg-white border-b border-gray-200 px-4 sm:px-8 py-3 flex items-center justify-between"
    >
      <NuxtLink
        :to="user ? '/dashboard' : '/'"
        class="text-sm font-semibold text-gray-900"
      >
        {{ t("nav.brand") }}
      </NuxtLink>

      <!-- Desktop nav -->
      <div class="hidden sm:flex items-center gap-6">
        <template v-if="user">
          <NuxtLink
            to="/dashboard"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("nav.overview") }}
          </NuxtLink>
          <NuxtLink
            to="/events"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("nav.events") }}
          </NuxtLink>
          <NuxtLink
            v-if="canManage"
            to="/admin/messages"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span class="relative inline-flex items-start">
              {{ t("nav.admin") }}
              <span
                v-if="hasUnreadAdminMessages"
                class="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-orange-600"
                aria-hidden="true"
              />
            </span>
          </NuxtLink>
          <UserMenu />
        </template>
        <template v-else>
          <NuxtLink
            to="/events"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("nav.events") }}
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("nav.login") }}
          </NuxtLink>
        </template>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="sm:hidden p-2 -mr-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        :aria-label="mobileMenuOpen ? 'Menu sluiten' : 'Menu openen'"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <svg
          v-if="!mobileMenuOpen"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <svg
          v-else
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 5l10 10M15 5L5 15"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </nav>

    <!-- Mobile menu drawer -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="mobileMenuOpen"
        class="sm:hidden bg-white border-b border-gray-100 px-4 pb-2"
      >
        <template v-if="user">
          <NuxtLink
            to="/dashboard"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            {{ t("nav.overview") }}
          </NuxtLink>
          <NuxtLink
            to="/events"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            {{ t("nav.events") }}
          </NuxtLink>
          <NuxtLink
            to="/profile"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            {{ t("nav.profile") }}
          </NuxtLink>
          <NuxtLink
            to="/contact"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            {{ t("nav.contact") }}
          </NuxtLink>
          <NuxtLink
            v-if="canManage"
            to="/admin/messages"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            <span class="relative inline-flex items-start">
              {{ t("nav.admin") }}
              <span
                v-if="hasUnreadAdminMessages"
                class="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-orange-600"
                aria-hidden="true"
              />
            </span>
          </NuxtLink>
          <button
            class="flex w-full items-center py-3 text-sm text-red-600 hover:text-red-700 transition-colors"
            @click="logout"
          >
            {{ t("nav.logout") }}
          </button>
        </template>
        <template v-else>
          <NuxtLink
            to="/events"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            {{ t("nav.events") }}
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            {{ t("nav.login") }}
          </NuxtLink>
        </template>
      </div>
    </Transition>

    <main class="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8">
      <slot />
    </main>
  </div>
</template>
