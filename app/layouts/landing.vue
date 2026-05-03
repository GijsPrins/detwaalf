<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();
const user = useSupabaseUser();
const supabase = useSupabaseClient();

const mobileMenuOpen = ref(false);
watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);

async function logout() {
  mobileMenuOpen.value = false;
  await supabase.auth.signOut();
  navigateTo("/");
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <!-- Navbar -->
    <nav
      class="border-b border-gray-100 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50"
    >
      <NuxtLink
        :to="user ? '/dashboard' : '/'"
        class="text-sm font-semibold text-gray-900 transition-colors hover:text-orange-600"
      >
        {{ t("nav.brand") }}
      </NuxtLink>

      <!-- Desktop nav -->
      <div class="hidden sm:flex items-center gap-6">
        <template v-if="user">
          <NuxtLink
            to="/dashboard"
            class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("nav.overview") }}
          </NuxtLink>
          <NuxtLink
            to="/events"
            class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("nav.events") }}
          </NuxtLink>
          <UserMenu />
        </template>
        <template v-else>
          <NuxtLink
            to="/events"
            class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("landing.nav.events") }}
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("landing.nav.privacy") }}
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {{ t("landing.nav.login") }}
          </NuxtLink>
        </template>
      </div>

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
            {{ t("landing.nav.events") }}
          </NuxtLink>
          <NuxtLink
            to="/privacy"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 border-b border-gray-50 transition-colors"
          >
            {{ t("landing.nav.privacy") }}
          </NuxtLink>
          <NuxtLink
            to="/login"
            class="flex items-center py-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            {{ t("landing.nav.login") }}
          </NuxtLink>
        </template>
      </div>
    </Transition>

    <div class="flex-1 flex flex-col">
      <slot />
    </div>
  </div>
</template>
