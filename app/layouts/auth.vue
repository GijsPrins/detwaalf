<script setup lang="ts">
import NavigationBackButton from "~/components/navigation/BackButton.vue";
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="fixed left-4 top-4 z-10 sm:left-6 sm:top-6">
      <NavigationBackButton />
    </div>
    <div class="min-h-screen flex items-center justify-center px-4 py-16">
    <slot />
    </div>
  </div>
</template>
