<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Import useRouter for navigation guards
import { supabase } from '@/utils/supabaseClient';
import { useHistoryStore } from '@/stores/history'; // Import useHistoryStore

// Imported components
import ProjectCanvas from './components/ProjectCanvas.vue';
import ProjectPanel from './components/ProjectPanel.vue';
import BlockSearchDialog from './components/BlockSearchDialog.vue';
import ImportSvgDialog from './components/ImportSvgDialog.vue';

const route = useRoute();
const router = useRouter(); // Initialize useRouter

const historyStore = useHistoryStore(); // Use the history store

const projectId = route.params.id;
const table = computed(() => route.params?.table || 'projects');
const project = ref(null);
const loading = ref(true);
const error = ref(null);
const mode = computed(() => (table.value == 'blocks' ? 'block' : 'project'));

const fetchProject = async () => {
  try {
    const { data, error: fetchError } = await supabase.from(table.value).select('*').eq('id', projectId).single();

    if (fetchError) {
      throw fetchError;
    }

    project.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// Handle project updates from ProjectCanvas.vue
const handleProjectUpdate = async (updatedNotes) => {
  project.value.notes = updatedNotes;
  try {
    const { data, error: persistError } = await supabase.from(table.value).update({ notes: updatedNotes }).eq('id', projectId).single();

    if (persistError) {
      throw persistError;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchProject();
});

// Handle navigation guard
router.beforeEach((to, from, next) => {
  if (!historyStore.saved) {
    const confirmLeave = window.confirm('You have unsaved changes. Do you really want to leave?');
    if (!confirmLeave) {
      return next(false); // Cancel navigation if user chooses not to leave
    }
  }

  // Clear history on route change
  historyStore.clearHistory();

  next(); // Proceed with navigation if there are no unsaved changes
});

// Dialog handling
const blockSearchDialog = ref(false);
function openBlockSearchDialog() {
  blockSearchDialog.value = true;
}
function closeBlockSearchDialog() {
  blockSearchDialog.value = false;
}

const importSvgDialog = ref(false);
function openImportSvgDialog() {
  importSvgDialog.value = true;
}
function closeImportSvgDialog() {
  importSvgDialog.value = false;
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <ProjectPanel
      :project="project"
      :mode="mode"
      @open-block-dialog="openBlockSearchDialog"
      @open-import-svg-dialog="openImportSvgDialog"
    />
    <ProjectCanvas :project="project" @update:project="handleProjectUpdate" :mode="mode" />
    <BlockSearchDialog :show="blockSearchDialog" @close-block-dialog="closeBlockSearchDialog" />
    <ImportSvgDialog :show="importSvgDialog" @close-import-svg-dialog="closeImportSvgDialog" />
  </div>
</template>
