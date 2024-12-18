<template>
  <v-dialog :model-value="show" @update:model-value="$emit('closeBlockDialog')" max-width="1200" height="600">
    <v-card elevation="0">
      <v-layout class="innerCard maxWidth d-flex flex-row" style="width: 100%">
        <v-layout class="d-flex flex-column flex-grow-0 flex-shrink-0">
          <v-card-title>Blocks</v-card-title>
          <v-list style="width: max-content">
            <v-list-item v-for="filter in filters" :key="filter" @click="applyFilter(filter)">
              <v-list-item-title>{{ filter }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="getTemplates">
              <v-list-item-title>Templates</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-layout>
        <v-layout class="flex-grow-1 flex-shrink-1">
          <v-layout elevation="0" class="maxWidth">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <v-text-field
                  v-model="searchQuery"
                  persistent-placeholder
                  placeholder="Search Blocks"
                  color="primary"
                  variant="outlined"
                  hide-details
                >
                  <template v-slot:prepend-inner>
                    <v-icon size="17" class="text-lightText">mdi-magnify</v-icon>
                  </template>
                </v-text-field>
              </div>
              <perfect-scrollbar style="height: 100%; padding-bottom: 40px">
                <div v-if="showTemplates" class="d-flex mt-4">
                  <v-row class="ma-0">
                    <template v-for="(template, i) in templates" :key="i">
                      <v-col>
                        <v-card
                          @click="importTemplate(template, $event)"
                          class="blockCard mx-auto overflow-hidden"
                          max-width="344"
                          min-width="244"
                        >
                          <v-img class="align-end" color="lightprimary" height="200px" cover :src="template.project_svg"></v-img>
                          <v-card-actions>
                            <div class="cursorPointer">
                              <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold cursorPointer">
                                {{ template.project_name }}
                              </h6>
                            </div>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                    </template>
                  </v-row>
                </div>
                <div v-else class="d-flex mt-4">
                  <v-row class="ma-0">
                    <template v-for="(block, i) in filteredBlocks" :key="i">
                      <v-col>
                        <v-card
                          @click="importBlock(block, $event)"
                          class="blockCard mx-auto overflow-hidden"
                          max-width="344"
                          min-width="244"
                        >
                          <v-img class="align-end" color="lightprimary" height="200px" cover :src="block.block_svg"></v-img>
                          <v-card-actions>
                            <div class="cursorPointer">
                              <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold cursorPointer">
                                {{ block.block_name }}
                              </h6>
                            </div>
                          </v-card-actions>
                        </v-card>
                      </v-col>
                    </template>
                  </v-row>
                </div>
              </perfect-scrollbar>
            </v-card-text>
          </v-layout></v-layout
        >
      </v-layout>
      <v-layout class="d-flex flex-row justify-center align-center mt-2" style="height: 100px">
        <v-btn color="primary" variant="text">
          <template v-slot:append>
            <v-btn @click="prevPage" :disabled="currentPage === 1" color="primary" variant="text">
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
            <v-btn @click="nextPage" :disabled="currentPage === totalPages" color="primary" variant="text">
              Next
              <template v-slot:append>
                <ChevronRightIcon stroke-width="1.5" width="20" />
              </template>
            </v-btn>
          </template>
        </v-btn>
      </v-layout>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, computed, onMounted } from 'vue';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'vue-router';
import { useSvgStore } from '@/stores/svgStore'; // Assumed to have actions for handling drawing

const emit = defineEmits(['closeBlockDialog']);
const props = defineProps({
  show: Boolean
});

const router = useRouter();
const blocks = ref([]);
const templates = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalBlocks = ref(0);
const totalTemplates = ref(0);
const selectedFilter = ref('All');
const filters = ['All', 'Category 1', 'Category 2', 'Category 3'];

const showTemplates = ref(false);

const svgStore = useSvgStore();

const getTemplates = async () => {
  showTemplates.value = true;
  await fetchTemplates();
};

const fetchBlocks = async () => {
  try {
    loading.value = true;
    let { data, error, count } = await supabase
      .schema('interconnectify')
      .from('blocks')
      .select('*', { count: 'exact' })
      .ilike('block_name', `%${searchQuery.value}%`)
      .range((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value - 1);

    if (error) throw error;

    blocks.value = data;
    totalBlocks.value = count;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const filteredBlocks = computed(() => {
  if (selectedFilter.value === 'All') {
    return blocks.value;
  }
  return blocks.value.filter((block) => block.category === selectedFilter.value);
});

const applyFilter = (filter) => {
  showTemplates.value = false;
  selectedFilter.value = filter;
  currentPage.value = 1;
  fetchBlocks();
};

const fetchTemplates = async () => {
  try {
    loading.value = true;
    let { data, error, count } = await supabase
      .schema('interconnectify')
      .from('templates')
      .select('*', { count: 'exact' })
      .ilike('project_name', `%${searchQuery.value}%`)
      .range((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value - 1);

    if (error) throw error;

    templates.value = data;
    totalTemplates.value = count;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchBlocks();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    fetchBlocks();
  }
};

const totalPages = computed(() => Math.ceil(totalBlocks.value / pageSize.value));

const importBlock = (block, event) => {
  svgStore.importBlock(block, event);
  emit('closeBlockDialog');
};

const importTemplate = (template, event) => {
  svgStore.startImportTemplate(template, event);
  emit('closeBlockDialog');
};

onMounted(() => {
  fetchBlocks();
});
</script>

<style scoped>
.blockCard {
  cursor: pointer;
}
</style>
