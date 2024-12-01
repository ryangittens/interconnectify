<!-- BottomSection.vue -->
<template>
  <v-layout class="position-absolute d-flex flex-column ml-2" style="bottom: 0; width: 100%">
    <ConductorSchedule style="width: 100%" />
    <v-layout class="mb-0 mt-1 d-flex flex-row justify-space-between align-center">
      <v-btn @click="openNotesDialog">Notes</v-btn>
      <ViewSelector @update:view="updateView" />
      <PageSelector />
    </v-layout>

    <!-- Notes Dialog Component -->
    <NotesDialog
      :isOpen="isNotesDialogOpen"
      :project="project"
      @update:isOpen="isNotesDialogOpen = $event"
      @update:project="updateProject"
    />
  </v-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ConductorSchedule from './ConductorSchedule.vue';
import NotesDialog from './NotesDialog.vue';
import PageSelector from './PageSelector.vue';
import ViewSelector from './ViewSelector.vue';

const props = defineProps({
  project: {
    type: Object || null,
    required: true
  }
});

const emit = defineEmits(['update:project', 'update:view']);

const isNotesDialogOpen = ref(false);

// Open the Notes Dialog
const openNotesDialog = () => {
  isNotesDialogOpen.value = true;
};

// Update the project when notes are saved from NotesDialog
const updateProject = (updatedProject) => {
  emit('update:project', updatedProject);
};

const updateView = (view) => {
  emit('update:view', view);
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
