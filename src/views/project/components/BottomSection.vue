<!-- BottomSection.vue -->
<template>
  <div class="position-absolute d-flex flex-column ml-2 bottomSection" style="bottom: 0; width: 100%">
    <v-slide-y-reverse-transition><ConductorSchedule v-if="store.showConductorSchedulePanel" /></v-slide-y-reverse-transition>

    <v-layout class="mb-0 mt-1 d-flex flex-row justify-space-between align-center">
      <v-btn class="mr-6" @click="toggleNotesDialog">Notes</v-btn>
      <!-- <ViewSelector v-if="mode == 'project'" class="mx-6" @update:view="updateView" /> -->
      <PageSelector class="ml-6" />
    </v-layout>

    <!-- Notes Dialog Component -->
    <NotesDialog
      v-if="isNotesDialogOpen"
      class="notesDialog"
      :isOpen="isNotesDialogOpen"
      :project="project"
      @update:isOpen="isNotesDialogOpen = $event"
      @update:project="updateProject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ConductorSchedule from './ConductorSchedule.vue';
import NotesDialog from './NotesDialog.vue';
import PageSelector from './PageSelector.vue';
import ViewSelector from './ViewSelector.vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const props = defineProps({
  project: Object || null,
  mode: String || null
});

const emit = defineEmits(['update:project', 'update:view']);

const isNotesDialogOpen = ref(false);

// Open the Notes Dialog
const toggleNotesDialog = () => {
  isNotesDialogOpen.value = !isNotesDialogOpen.value;
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

.bottomSection {
  overflow: visible;
}
.notesDialog {
  bottom: 50px;
}
</style>
