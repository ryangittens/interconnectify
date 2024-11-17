<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/utils/supabaseClient';

// imported components
import ProjectCanvas from './components/ProjectCanvas.vue';
import ProjectPanel from './components/ProjectPanel.vue';
import BlockSearchDialog from './components/BlockSearchDialog.vue';
import ImportSvgDialog from './components/ImportSvgDialog.vue';

const route = useRoute();
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

onMounted(fetchProject);

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
    <!-- <h1>{{ project.name }}</h1>
    <p>{{ project.description }}</p> -->
    <ProjectPanel
      :project="project"
      :mode="mode"
      @open-block-dialog="openBlockSearchDialog"
      @open-import-svg-dialog="openImportSvgDialog"
    />
    <ProjectCanvas :project="project" :mode="mode" />
    <BlockSearchDialog :show="blockSearchDialog" @close-block-dialog="closeBlockSearchDialog" />
    <ImportSvgDialog :show="importSvgDialog" @close-import-svg-dialog="closeImportSvgDialog" />
    <!-- Add more project details here -->
  </div>
</template>
