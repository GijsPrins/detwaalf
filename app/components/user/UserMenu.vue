<script setup lang="ts">
const { t } = useI18n()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile } = useProfile()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const displayName = computed(
  () => profile.value?.display_name ?? user.value?.email ?? '?',
)

const initials = computed(() => {
  const name = profile.value?.display_name ?? user.value?.email ?? ''
  return name
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
})

function toggle() {
  isOpen.value = !isOpen.value
}

async function logout() {
  isOpen.value = false
  await supabase.auth.signOut()
  navigateTo('/')
}

// Close on outside click
onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})

function handleOutsideClick(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}
</script>

<template>
  <div ref="menuRef" class="user-menu">
    <button
      id="user-menu-trigger"
      class="user-menu__trigger"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggle"
    >
      <span class="user-menu__avatar" aria-hidden="true">{{ initials }}</span>
      <span class="user-menu__name">{{ displayName }}</span>
      <svg
        class="user-menu__chevron"
        :class="{ 'user-menu__chevron--open': isOpen }"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <Transition name="menu-fade">
      <div
        v-if="isOpen"
        class="user-menu__dropdown"
        role="menu"
        aria-labelledby="user-menu-trigger"
      >
        <div class="user-menu__header">
          <span class="user-menu__header-avatar">{{ initials }}</span>
          <div class="user-menu__header-info">
            <span class="user-menu__header-name">{{ displayName }}</span>
            <span class="user-menu__header-email">{{ user?.email }}</span>
          </div>
        </div>

        <div class="user-menu__divider" />

        <NuxtLink
          to="/profile"
          class="user-menu__item"
          role="menuitem"
          @click="isOpen = false"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M7.5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 13c0-2.761 2.462-5 5.5-5S13 10.239 13 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          {{ t('nav.profile') }}
        </NuxtLink>

        <div class="user-menu__divider" />

        <button
          class="user-menu__item user-menu__item--danger"
          role="menuitem"
          @click="logout"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M5 1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h3M10 11l4-4-4-4M14 7.5H5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ t('nav.logout') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}

.user-menu__trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  color: #374151;
}

.user-menu__trigger:hover {
  border-color: #d1d5db;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.user-menu__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 9999px;
  background: #111827;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

.user-menu__name {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu__chevron {
  color: #9ca3af;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.user-menu__chevron--open {
  transform: rotate(180deg);
}

/* Dropdown */
.user-menu__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 220px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06);
  z-index: 50;
  overflow: hidden;
  padding: 6px;
}

.user-menu__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 12px;
}

.user-menu__header-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-menu__header-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.user-menu__header-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu__header-email {
  font-size: 11px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu__divider {
  height: 1px;
  background: #f3f4f6;
  margin: 2px 0;
}

.user-menu__item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  text-align: left;
}

.user-menu__item:hover {
  background: #f9fafb;
  color: #111827;
}

.user-menu__item--danger {
  color: #dc2626;
}

.user-menu__item--danger:hover {
  background: #fef2f2;
  color: #b91c1c;
}

/* Transition */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
