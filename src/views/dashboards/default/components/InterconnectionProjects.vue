<script setup lang="ts">
import { ref, computed } from 'vue';

// import icons
import { ChevronUpIcon, ChevronDownIcon } from 'vue-tabler-icons';

const projects = ref([
  {
    name: 'Bajaj Finery',
    price: 145.58,
    profit: 10
  },
  {
    name: 'TTML',
    price: 6.368,
    profit: 10
  },
  {
    name: 'Reliance',
    price: 458.63,
    profit: 10
  },
  {
    name: 'TTML',
    price: 5.631,
    profit: 10
  },
  {
    name: 'Stolon',
    price: 6.368,
    profit: 10
  }
]);
</script>

<template>
  <v-card elevation="0">
    <v-card variant="outlined">
      <v-card-text>
        <div class="d-flex align-center">
          <h4 class="text-h4 mt-1">Projects</h4>
        </div>
        <div class="mt-4">
          <perfect-scrollbar v-bind:style="{ height: '470px' }">
            <v-list lines="two" class="py-0">
              <v-list-item v-for="(project, i) in projects" :key="i" :value="project" color="secondary" rounded="sm">
                <template v-slot:append>
                  <div
                    class="bg-lightsuccess rounded-sm d-flex align-center justify-center ml-3"
                    style="width: 20px; height: 20px"
                    v-if="project.price > 145"
                  >
                    <ChevronUpIcon stroke-width="1.5" width="20" class="text-success" />
                  </div>
                  <div class="bg-lighterror rounded-sm d-flex align-center justify-center ml-3" style="width: 20px; height: 20px" v-else>
                    <ChevronDownIcon stroke-width="1.5" width="20" class="text-error" />
                  </div>
                </template>
                <div class="d-inline-flex align-center justify-space-between w-100">
                  <div>
                    <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold">
                      {{ project.name }}
                    </h6>
                    <span v-if="project.price > 145" class="text-success text-subtitle-2">{{ project.profit }}% Profit</span>
                    <span v-else class="text-error text-subtitle-2">{{ project.profit }}% Profit</span>
                  </div>

                  <div class="ml-auto text-subtitle-1 text-medium-emphasis font-weight-bold">${{ project.price }}</div>
                </div>
              </v-list-item>
            </v-list>
          </perfect-scrollbar>

          <div class="text-center mt-3">
            <v-btn color="primary" variant="text"
              >View All
              <template v-slot:append>
                <ChevronRightIcon stroke-width="1.5" width="20" />
              </template>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-card>
</template>
