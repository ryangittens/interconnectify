<template>
  <RouterView></RouterView>
  <GlobalSnackbar />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import GlobalSnackbar from '@/components/shared/GlobalSnackbar.vue';
</script>
