<script setup lang="ts">
import { ref } from 'vue';
// imported components
import ProjectCanvas from './components/ProjectCanvas.vue';
import ProjectPanel from './components/ProjectPanel.vue';
import BlockDialog from './components/BlockDialog.vue';

let blockDialog = ref(false);
function openBlockDialog() {
  blockDialog.value = true;
}
function closeBlockDialog() {
  blockDialog.value = false;
}
</script>

<template>
  <ProjectPanel @open-block-dialog="openBlockDialog" />
  <ProjectCanvas />
  <BlockDialog :show="blockDialog" @close-block-dialog="closeBlockDialog" />
</template>
