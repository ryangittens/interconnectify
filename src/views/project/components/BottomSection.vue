<!-- BottomSection.vue -->
<template>
  <v-layout class="position-absolute d-flex flex-column ml-2" style="bottom: 0">
    <v-layout class="mb-3">
      <v-btn @click="openNotesDialog">Notes</v-btn>
    </v-layout>

    <ConductorSchedule />

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

const props = defineProps({
  project: {
    type: Object || null,
    required: true
  }
});

const emit = defineEmits(['update:project']);

const isNotesDialogOpen = ref(false);

// Open the Notes Dialog
const openNotesDialog = () => {
  isNotesDialogOpen.value = true;
};

// Update the project when notes are saved from NotesDialog
const updateProject = (updatedProject) => {
  emit('update:project', updatedProject);
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
