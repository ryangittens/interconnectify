<!-- NotesDialog.vue -->
<template>
  <v-dialog v-model="isDialogOpen" persistent max-width="600px">
    <v-card>
      <v-card-title class="headline">Project Notes</v-card-title>
      {{ store.conductors }}
      <v-card-text>
        <v-textarea v-model="editableNotes" label="Enter your notes here" rows="10" outlined></v-textarea>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
        <v-btn color="primary" text @click="saveNotes">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useSvgStore } from '@/stores/svgStore';

// Use the snackbar store
const snackbarStore = useSnackbarStore();
const store = useSvgStore();

// Define props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object || null,
    required: true
  }
});

// Define emits
const emit = defineEmits(['update:isOpen', 'update:project']);

// Local state
const isDialogOpen = ref(props.isOpen);
const editableNotes = ref(props?.project?.notes || '');

// Watch for changes in the isOpen prop
watch(
  () => props.isOpen,
  (newVal) => {
    isDialogOpen.value = newVal;
    if (newVal) {
      editableNotes.value = props?.project?.notes || '';
    }
  }
);

// Watch for changes in the project.notes prop
watch(
  () => props?.project?.notes,
  (newNotes) => {
    if (!isDialogOpen.value) {
      editableNotes.value = newNotes;
    }
  }
);

// Save notes and emit the updated project
const saveNotes = () => {
  // Create an updated project object
  const updatedNotes = editableNotes.value;

  // Emit the updated project to the parent component
  emit('update:project', updatedNotes);

  // Close the dialog
  closeDialog();

  // Show success notification
  snackbarStore.showSnackbar('Notes saved successfully!', 'success');
};

// Close the dialog without saving
const closeDialog = () => {
  emit('update:isOpen', false);
  isDialogOpen.value = false;
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
