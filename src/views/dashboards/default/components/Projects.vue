<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { supabase } from '@/utils/supabaseClient';
import { useAuthStore } from '@/stores/auth';
import { ChevronRightIcon, ChevronLeftIcon, DotsIcon, PlusIcon } from 'vue-tabler-icons';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const projects = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalProjects = ref(0);

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
  <v-card elevation="0" class="innerCard maxWidth">
    <v-card-text>
      <div class="d-flex align-center justify-space-between">
        <h4 class="text-h4">Projects</h4>
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
          <v-list lines="two" class="py-0">
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
          </v-list>
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
