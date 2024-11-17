<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeMount } from 'vue';
import { supabase } from '@/utils/supabaseClient';
import { useAuthStore } from '@/stores/auth';
import { ChevronRightIcon, ChevronLeftIcon, DotsIcon, PlusIcon, HeartFilledIcon } from 'vue-tabler-icons';
import { useRouter } from 'vue-router';

import ProjectDetailsModal from '@/components/shared/CreateProjectModal.vue';

import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();

const authStore = useAuthStore();
const router = useRouter();
const projects = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalProjects = ref(0);
const show = ref({});
const projectIdToDelete = ref(null);

const projectDialog = ref(false);

const selectedTemplate = ref(null);

function openProjectDialog() {
  projectDialog.value = true;
}

function closeProjectDialog() {
  projectDialog.value = false;
  selectTemplate(null);
}

const deleteTemplate = async (projectId) => {
  const confirmed = window.confirm('Are you sure you want to delete this project?');
  if (!confirmed) return;

  try {
    const { error: deleteError } = await supabase.from('templates').delete().eq('id', projectId);

    if (deleteError) {
      throw deleteError;
    }

    projects.value = projects.value.filter((project) => project.id !== projectId);
    totalProjects.value = projects.value.length;
  } catch (err) {
    error.value = err.message;
    snackbarStore.showSnackbar('Error Deleting Project', 'error');
  }
};

function selectTemplate(template: any) {
  selectedTemplate.value = template;
  if (template) {
    openProjectDialog();
  }
}

const filteredProjects = computed(() => {
  if (!searchQuery.value) {
    return projects.value;
  }
  return projects.value.filter((project) => project.project_name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const fetchProjects = async () => {
  loading.value = true;
  try {
    const user = authStore.user;
    const from = (currentPage.value - 1) * pageSize.value;
    const to = currentPage.value * pageSize.value - 1;

    const {
      data,
      error: fetchError,
      count
    } = await supabase
      .from('templates')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (fetchError) {
      throw fetchError;
    }

    projects.value = data;
    totalProjects.value = count;
  } catch (err) {
    error.value = err.message;
    snackbarStore.showSnackbar('Error Fetching Projects', 'error');
  } finally {
    loading.value = false;
  }
};

const toggleProjectPanel = (projectId) => {
  show.value[projectId] = !show.value[projectId];
};

const totalPages = computed(() => Math.ceil(totalProjects.value / pageSize.value));

// onMounted(fetchProjects);
fetchProjects();

watch([currentPage, searchQuery], fetchProjects);
</script>

<template>
  <ProjectDetailsModal :show="projectDialog" :selectedTemplate="selectedTemplate" @close-project-dialog="closeProjectDialog" />
  <v-card elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <div class="d-flex align-center justify-space-between">
        <h4 class="text-h4">Templates</h4>
      </div>
      <div class="d-flex align-center justify-space-between mt-4">
        <v-text-field
          v-model="searchQuery"
          class=""
          persistent-placeholder
          placeholder="Search Templates"
          color="primary"
          variant="outlined"
          hide-details
        >
          <template v-slot:prepend-inner>
            <SearchIcon stroke-width="1.5" size="17" class="text-lightText SearchIcon" />
          </template>
        </v-text-field>
        <v-btn @click="openProjectDialog" class="ml-4" color="primary" size="large" icon rounded="sm" variant="tonal">
          <PlusIcon stroke-width="1.5" width="25" />
        </v-btn>
      </div>
      <div class="mt-4">
        <perfect-scrollbar class="perfectScroll">
          <v-row class="ma-0">
            <template v-for="(project, i) in filteredProjects" :key="i">
              <v-col>
                <v-card class="mx-auto overflow-hidden" max-width="344" min-width="244">
                  <v-img class="align-end" color="lightprimary" height="200px" cover :src="project.project_svg">
                    <v-btn @click="deleteTemplate(project.id)" class="deleteProjectIcon" color="error" icon rounded="lg" variant="text">
                      <TrashIcon stroke-width="1.5" width="25" /> </v-btn
                  ></v-img>

                  <v-card-actions>
                    <div @click="selectTemplate(project)" class="cursorPointer">
                      <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold cursorPointer">
                        {{ project.project_name }}
                      </h6>
                    </div>
                    <v-spacer></v-spacer>

                    <v-btn
                      size="small"
                      :icon="show[project.id] ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                      @click="toggleProjectPanel(project.id)"
                    ></v-btn>
                  </v-card-actions>

                  <v-expand-transition>
                    <div v-show="show[project.id]">
                      <v-divider></v-divider>

                      <v-card-text>
                        <div>
                          <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold">
                            {{ project.project_name }}
                          </h6>
                        </div>
                        <p>{{ project.project_description }}</p>
                      </v-card-text>
                    </div>
                  </v-expand-transition>
                </v-card>
              </v-col>
            </template>
          </v-row>
        </perfect-scrollbar>

        <div class="text-center mt-2">
          <v-btn color="primary" variant="text">
            <template v-slot:append>
              <v-btn @click="currentPage > 1 && currentPage--" :disabled="currentPage === 1" color="primary" variant="text">
                Previous
                <template v-slot:prepend>
                  <ChevronLeftIcon stroke-width="1.5" width="20" />
                </template>
              </v-btn>
            </template>
          </v-btn>
          <span>{{ currentPage }} / {{ totalPages }}</span>
          <v-btn color="primary" variant="text">
            <template v-slot:append>
              <v-btn
                @click="currentPage < totalPages && currentPage++"
                :disabled="currentPage === totalPages"
                color="primary"
                variant="text"
              >
                Next
                <template v-slot:append>
                  <ChevronRightIcon stroke-width="1.5" width="20" />
                </template>
              </v-btn>
            </template>
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
.deleteProjectIcon {
  position: absolute;
  top: 0;
  right: 0;
}
.projectCard {
  position: relative;
}
.cursorPointer {
  cursor: pointer;
}

.perfectScroll {
  width: 100%;
  height: calc(100vh - 310px);
}
</style>
