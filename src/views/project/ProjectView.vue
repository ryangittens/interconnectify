<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/utils/supabaseClient';

// imported components
import ProjectCanvas from './components/ProjectCanvas.vue';
import ProjectPanel from './components/ProjectPanel.vue';
import BlockDialog from './components/BlockDialog.vue';

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

const blockDialog = ref(false);
function openBlockDialog() {
  blockDialog.value = true;
}
function closeBlockDialog() {
  blockDialog.value = false;
}
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <!-- <h1>{{ project.name }}</h1>
    <p>{{ project.description }}</p> -->
    <ProjectPanel :project="project" :mode="mode" @open-block-dialog="openBlockDialog" />
    <ProjectCanvas :project="project" :mode="mode" />
    <BlockDialog :show="blockDialog" @close-block-dialog="closeBlockDialog" />
    <!-- Add more project details here -->
  </div>
</template>
