<template>
  <CreateSDLProjectModal :show="projectDialog" :designs="designs" @close-project-dialog="closeProjectDialog" />
  <v-container fluid>
    <!-- Main Content Row with Map and Chart -->
    <!-- <v-row>
      <v-col cols="12" lg="8">
        <v-card class="pa-4" style="height: 100%; min-height: 500px">
          <ProjectMap :items="items" :totalProposals="totalProposals" />
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card class="pa-4" style="height: 100%; min-height: 500px">
          <TopJurisdictionsOrStates :jurisdictionsData="jurisdictionsData" :statesData="statesData" />
        </v-card>
      </v-col>
    </v-row> -->
    <v-row>
      <v-col cols="12">
        <v-card class="pa-4" elevation="2" style="height: 100%">
          <!-- Existing Toolbar -->
          <v-toolbar class="mb-2 bg-primary" rounded>
            <v-card-title>
              <span class="ml-3">Projects</span>
            </v-card-title>
            <v-spacer></v-spacer>
            <v-text-field
              class="mx-4"
              v-model="search"
              append-inner-icon="mdi-magnify"
              label="Search"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              @input="updateQueryParams"
            ></v-text-field>

            <v-select
              v-model="sortBy"
              :items="sortOptions"
              item-title="text"
              item-value="value"
              label="Sort By"
              hide-details
              density="compact"
              class="mx-4"
              @change="updateQueryParams"
            />
            <!-- <v-btn icon to="/CreateProposal">
              <v-tooltip activator="parent" location="top"> Create New Project </v-tooltip>
              <v-icon>mdi-plus</v-icon>
            </v-btn> -->
          </v-toolbar>
          <v-data-table :headers="headers" :items="filteredItems" :search="search" v-model:items-per-page="itemsPerPage" :loading="loading">
            <template v-slot:item.project_name="{ item }">
              <div @click="selectProposal(item.proposal_id)" class="cursorPointer">
                <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold cursorPointer">
                  {{ item.project_name }}
                </h6>
              </div>
            </template>

            <template v-slot:item.project_scale="{ item }">
              <span class="text-capitalize">{{ item.project_scale }}</span>
            </template>

            <template v-slot:item.created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ProjectMap from '@/components/analytics/ProjectMap.vue';
import TopJurisdictionsOrStates from '@/components/analytics/TopJurisdictionsOrStates.vue';
import { supabase } from '@/utils/supabaseClient';

import CreateSDLProjectModal from './components/CreateSDLProjectModal.vue';

// Access router and route
const router = useRouter();
const route = useRoute();

// Reactive variables
const search = ref(route.query.search || '');
const sortBy = ref(route.query.sortBy || 'created_at_desc');
const itemsPerPage = ref(6);
const items = ref([]);
const loading = ref(false);
const totalProposals = ref(0);
const proposalsLastMonth = ref(0);
const jurisdictionsData = ref([]); // Top jurisdictions data
const statesData = ref([]); // Top states data
const cacheKey = 'cachedProjects'; // Cache key for localStorage

// Constants
const headers = [
  { title: 'Name', key: 'project_name' },
  { title: 'Address', key: 'address' },
  { title: 'Jurisdiction', key: 'jurisdiction' },
  { title: 'Scale', key: 'project_scale' },
  { title: 'Created By', key: 'created_by' },
  { title: 'Created Date', key: 'created_at' },
  { title: 'Exported', key: 'eng_exported' }
];

const sortOptions = [
  { text: 'Date Descending', value: 'created_at_desc' },
  { text: 'Date Ascending', value: 'created_at_asc' },
  { text: 'Scale (Commercial)', value: 'scale_commercial' },
  { text: 'Scale (Residential)', value: 'scale_residential' }
];

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
}

// Computed property for filtered items
const filteredItems = computed(() => {
  let filtered = [...items.value]; // Clone the array to avoid mutating the original

  if (sortBy.value) {
    switch (sortBy.value) {
      case 'created_at_asc':
        filtered.sort((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? 1 : -1));
        break;
      case 'created_at_desc':
        filtered.sort((a, b) => (new Date(a.created_at) < new Date(b.created_at) ? 1 : -1));
        break;
      case 'scale_commercial':
        filtered = filtered.filter((item) => item.project_scale === 'commercial');
        break;
      case 'scale_residential':
        filtered = filtered.filter((item) => item.project_scale === 'residential');
        break;
    }
  }

  return filtered;
});

// Method to update query parameters
function updateQueryParams() {
  router.replace({
    query: {
      search: search.value || undefined,
      sortBy: sortBy.value || undefined
    }
  });
}

// Method to fetch data with caching
async function fetchData() {
  try {
    // Load cached data initially
    loadCachedData();

    let allProposals = [];
    let start = 0;
    const limit = 1000;
    let proposalsData, proposalsError;

    do {
      ({ data: proposalsData, error: proposalsError } = await supabase
        .from('proposals')
        .select(
          `
            project_name,
            address,
            state,
            jurisdiction,
            created_at,
            proposal_id,
            user_id,
            project_scale,
            lat,
            lng,
            eng_exported,
            users ( user_name )
          `
        )
        .order('created_at', { ascending: false })
        .range(start, start + limit - 1));

      if (proposalsError) throw proposalsError;

      allProposals = [...allProposals, ...proposalsData];
      start += limit;
    } while (proposalsData.length === limit);

    items.value = allProposals.map((item) => {
      const newItem = { ...item }; // Clone the item
      newItem.created_by = newItem.users ? newItem.users.user_name : '';
      delete newItem.users;
      return newItem;
    });

    // Cache the fetched data
    cacheData();

    // Calculate totalProposals
    totalProposals.value = items.value.length;

    // Calculate proposals in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    proposalsLastMonth.value = items.value.filter((item) => new Date(item.created_at) > thirtyDaysAgo).length;

    // Calculate top jurisdictions and states
    calculateTopJurisdictionsAndStates();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Method to cache data in localStorage
function cacheData() {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(items.value));
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

// Method to load cached data from localStorage
function loadCachedData() {
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      items.value = JSON.parse(cachedData);
    }
  } catch (error) {
    console.error('Error loading cached data:', error);
  }
}

// Method to calculate top jurisdictions and states
function calculateTopJurisdictionsAndStates() {
  let jurisdictionCounts = {};
  let stateCounts = {};

  items.value.forEach((item) => {
    if (item.jurisdiction) {
      jurisdictionCounts[item.jurisdiction] = (jurisdictionCounts[item.jurisdiction] || 0) + 1;
    }

    if (item.state) {
      stateCounts[item.state] = (stateCounts[item.state] || 0) + 1;
    }
  });

  jurisdictionsData.value = Object.entries(jurisdictionCounts)
    .map(([jurisdiction, count]) => ({ jurisdiction, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 jurisdictions

  statesData.value = Object.entries(stateCounts)
    .map(([jurisdiction, count]) => ({ jurisdiction, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 states
}

// Lifecycle hook
onMounted(() => {
  fetchData();
});

// Watcher for route query changes
watch(
  () => route.query,
  (newQuery) => {
    search.value = newQuery.search || '';
    sortBy.value = newQuery.sortBy || 'created_at_desc';
  },
  { immediate: true }
);

const projectDialog = ref(false);
const show = ref({});
const selectedProposalId = ref(null);
const designs = ref([]);

async function fetchProjects(proposalId) {
  try {
    // Fetch project data
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('project_id, design_name, panel_wattage, created_at, users ( user_name )')
      .eq('proposal_id', proposalId);

    if (projectError) throw projectError;
    designs.value = projectData;
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

function openProjectDialog() {
  projectDialog.value = true;
}

function closeProjectDialog() {
  projectDialog.value = false;
  selectedProposalId.value = null;
}

async function selectProposal(proposalId) {
  selectedProposalId.value = proposalId;
  if (proposalId) {
    await fetchProjects(proposalId);
    openProjectDialog();
  }
}
</script>

<style lang="scss">
.cursorPointer {
  cursor: pointer;
}
</style>
