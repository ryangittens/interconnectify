<template>
  <v-navigation-drawer :model-value="drawer" temporary location="right" :scrim="false" rounded class="infoPanel">
    <div class="d-flex flex-row justify-space-between">
      <v-list-item>
        <div class="text-capitalize">{{ selectedObject?.object }}</div>
      </v-list-item>
      <v-btn @click="deleteObject" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
        <TrashXIcon size="17" color="red" stroke-width="1.5" />
      </v-btn>
    </div>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item v-for="(field, index) in drawerFields" :key="index">
        <v-text-field v-model="selectedObject[field.key]" :label="field.label" :value="selectedObject[field.key]"></v-text-field>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useSvgStore } from '@/stores/svgStore';
import { computed } from 'vue';
import { TrashXIcon } from 'vue-tabler-icons';
import { useHistoryStore } from '@/stores/history';
import { DeleteBlockCommand, DeleteLineCommand } from '@/commands';

const historyStore = useHistoryStore();
const store = useSvgStore();
const { deleteObject } = store;

const drawer = computed(() => {
  return !store.isDrawing && selectedObject.value ? true : false;
});

const selectedObject = computed(() => store.getSelectedObject());

const drawerFields = computed(() => {
  if (selectedObject.value?.object === 'connectionPoint') {
    return [
      { label: 'Voltage', key: 'voltage' },
      { label: 'Connection Type', key: 'connectionType' }
    ];
  }
  // Add other conditions for different object types if necessary
  return [];
});
</script>

<style scoped>
.infoPanel {
  width: 300px;
}
</style>
