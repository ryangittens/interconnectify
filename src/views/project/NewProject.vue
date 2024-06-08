<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '@/utils/supabaseClient';
import { useAuthStore } from '@/stores/auth';
import { ChevronRightIcon, ChevronLeftIcon, DotsIcon, PlusIcon, HeartFilledIcon } from 'vue-tabler-icons';
import { useRouter } from 'vue-router';

import ProjectDetailsModal from './components/ProjectDetailsModal.vue';

const authStore = useAuthStore();
const router = useRouter();
const projects = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalProjects = ref(0);

const projectDialog = ref(false);

function openProjectDialog() {
  projectDialog.value = true;
  console.log('got here');
}
function closeProjectDialog() {
  projectDialog.value = false;
}

const show = ref(false);
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
      .from('projects')
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
  } finally {
    loading.value = false;
  }
};

const totalPages = computed(() => Math.ceil(totalProjects.value / pageSize.value));

onMounted(fetchProjects);

watch([currentPage, searchQuery], fetchProjects);

const goToProject = (projectId) => {
  router.push({ name: 'ProjectView', params: { id: projectId } });
};
</script>

<template>
  <ProjectDetailsModal :show="projectDialog" @close-project-dialog="closeProjectDialog" />
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
          placeholder="Search Projects"
          color="primary"
          variant="outlined"
          hide-details
        >
          <template v-slot:prepend-inner>
            <SearchIcon stroke-width="1.5" size="17" class="text-lightText SearchIcon" />
          </template>
        </v-text-field>
        <v-btn class="ml-4" color="primary" size="large" icon rounded="sm" variant="tonal">
          <PlusIcon stroke-width="1.5" width="25" />
        </v-btn>
      </div>
      <div class="mt-4">
        <perfect-scrollbar>
          <!-- <v-list lines="two" class="py-0">
            <v-list-item
              v-for="(project, i) in filteredProjects"
              @click="goToProject(project.id)"
              :key="i"
              :value="project"
              color="secondary"
              rounded="sm"
            >
              <div class="d-inline-flex align-center justify-space-between w-100">
                <div>
                  <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold">
                    {{ project.project_name }}
                  </h6>
                </div>
              </div>
            </v-list-item>
          </v-list> -->
          <v-row class="ma-0">
            <v-col>
              <v-card class="mx-auto overflow-hidden" max-width="344" min-width="244">
                <v-img class="align-end" gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)" height="200px" cover src="">
                  <!-- <v-card-title class="text-white text-caption">Blank Design</v-card-title> -->
                  <v-btn class="" color="error" icon rounded="lg" variant="text">
                    <HeartFilledIcon stroke-width="1.5" width="25" />
                  </v-btn>
                </v-img>

                <v-card-actions>
                  <v-btn @click="openProjectDialog" color="orange-lighten-2" variant="text" text="Blank Design"></v-btn>

                  <v-spacer></v-spacer>

                  <v-btn size="small" :icon="show ? 'mdi-chevron-up' : 'mdi-chevron-down'" @click="show = !show"></v-btn>
                </v-card-actions>

                <v-expand-transition>
                  <div v-show="show">
                    <v-divider></v-divider>

                    <v-card-text>
                      I'm a thing. But, like most politicians, he promised more than he could deliver. You won't have time for sleeping,
                      soldier, not with all the bed making you'll be doing. Then we'll go with that data file! Hey, you add a one and two
                      zeros to that or we walk! You're going to do his laundry? I've got to find a way to escape.
                    </v-card-text>
                  </div>
                </v-expand-transition>
              </v-card>
            </v-col>

            <template v-for="(project, i) in filteredProjects" :key="i">
              <v-col>
                <v-card class="mx-auto overflow-hidden" max-width="344" min-width="244">
                  <v-img
                    class="align-end"
                    gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
                    height="200px"
                    cover
                    src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
                  >
                    <v-btn class="" color="error" icon rounded="lg" variant="text">
                      <HeartFilledIcon stroke-width="1.5" width="25" /> </v-btn
                  ></v-img>

                  <v-card-actions>
                    <v-btn @click="goToProject(project.id)" color="orange-lighten-2" variant="text" v-text="project.project_name"></v-btn>

                    <v-spacer></v-spacer>

                    <v-btn size="small" :icon="show ? 'mdi-chevron-up' : 'mdi-chevron-down'" @click="show = !show"></v-btn>
                  </v-card-actions>

                  <v-expand-transition>
                    <div v-show="show">
                      <v-divider></v-divider>

                      <v-card-text>
                        I'm a thing. But, like most politicians, he promised more than he could deliver. You won't have time for sleeping,
                        soldier, not with all the bed making you'll be doing. Then we'll go with that data file! Hey, you add a one and two
                        zeros to that or we walk! You're going to do his laundry? I've got to find a way to escape.
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
.projectForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>
