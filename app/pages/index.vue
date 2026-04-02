<script setup lang="ts">
const user = useSupabaseUser()
</script>

<template>
  <div class="p-8">
    <p>{{ user?.email }}</p>
  </div>
</template>
