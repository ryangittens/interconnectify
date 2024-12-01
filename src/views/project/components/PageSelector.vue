<template>
  <v-slide-group v-model="store.currentPageIndex" class="pa-0" center-active show-arrows mandatory>
    <!-- Display currentPageIndex for debugging -->
    <v-slide-group-item v-for="n in pageOptions" :key="n.index" :value="n.index" v-slot="{ isSelected, toggle }">
      <v-btn :color="store.currentPageIndex === n.index ? 'primary' : undefined" class="ma-1" rounded @click="toggle">
        {{ n.name }}
      </v-btn>
    </v-slide-group-item>
    <v-slide-group-item>
      <v-btn class="ma-1" @click="addNewPage" rounded>
        <IconPlus size="20" stroke-width="1.5" />
      </v-btn>
    </v-slide-group-item>
  </v-slide-group>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { IconPlus } from '@tabler/icons-vue';

const store = useSvgStore();

const pageOptions = computed(() => store.pageStates.map((_, index) => ({ name: `Page ${index + 1}`, index })));

const addNewPage = () => {
  store.addNewPage();
  // Optionally, set the current page to the new page
  //store.currentPageIndex = store.pageStates.length - 1;
};

watch(
  () => store.currentPageIndex,
  (newIndex, oldIndex) => {
    store.switchPage(newIndex, oldIndex);
    store.initializePaperSpace();
  }
);
</script>
