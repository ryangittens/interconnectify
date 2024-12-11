<template>
  <v-slide-group v-model="store.currentPageIndex" class="pa-0" center-active show-arrows mandatory>
    <!-- Display currentPageIndex for debugging -->
    <v-slide-group-item v-for="n in pageOptions" :key="n.index" :value="n.index" v-slot="{ isSelected, toggle }">
      <v-btn
        @dblclick.stop="editPageName(n.index)"
        :color="store.currentPageIndex === n.index ? 'primary' : undefined"
        class="ma-1"
        rounded
        @click="toggle"
      >
        {{ n.name }}
      </v-btn>
    </v-slide-group-item>
    <v-slide-group-item>
      <v-btn class="ma-1" @click="addNewPage" rounded>
        <IconPlus size="20" stroke-width="1.5" />
      </v-btn>
    </v-slide-group-item>
  </v-slide-group>
  <v-dialog v-model="showRenameDialog" max-width="500px" v-bind="$attrs">
    <v-card>
      <v-card-title>Rename Page</v-card-title>
      <v-card-text>
        <v-text-field v-model="newPageName" label="Page Name"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="showRenameDialog = false">Cancel</v-btn>
        <v-btn color="primary" text @click="savePageName">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { IconPlus } from '@tabler/icons-vue';

const store = useSvgStore();

const pageOptions = computed(() => store.pages);

const showRenameDialog = ref(false);
const newPageName = ref('');
const pageIndexToRename = ref(null);

const addNewPage = () => {
  store.addNewPage();
  // Optionally, set the current page to the new page
  // store.currentPageIndex = store.pages.length - 1;
};

const editPageName = (index) => {
  pageIndexToRename.value = index;
  newPageName.value = store.pages[index].name;
  showRenameDialog.value = true;
};

const savePageName = () => {
  if (pageIndexToRename.value !== null) {
    store.renamePage(pageIndexToRename.value, newPageName.value);
  }
  showRenameDialog.value = false;
};

watch(
  () => store.currentPageIndex,
  (newIndex, oldIndex) => {
    store.switchPage(newIndex, oldIndex);
    store.initializePaperSpace();
  }
);
</script>
