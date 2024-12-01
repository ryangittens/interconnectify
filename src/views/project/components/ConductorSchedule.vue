<template>
  <v-expansion-panels class="conductorSchedulePanel" v-model="store.showConductorSchedulePanel">
    <v-expansion-panel title="Conductor Schedule">
      <v-expansion-panel-text>
        <table class="conductorTable">
          <thead>
            <tr>
              <th></th>
              <!-- Empty header for drag handle -->
              <th v-for="heading in store.conductorTableHeadings" :key="heading.key">
                {{ heading.title.toUpperCase() }}
              </th>
            </tr>
          </thead>
          <draggable
            v-model="store.wireRuns"
            @end="onDragEnd"
            tag="tbody"
            :options="{ handle: '.drag-handle', animation: 150 }"
            item-key="id"
          >
            <template #item="{ element }">
              <tr :class="{ selected: isSelected(element) }">
                <!-- Drag Handle -->
                <td class="drag-handle">
                  <v-icon small>mdi-drag</v-icon>
                </td>
                <!-- Table Data -->
                <td v-for="heading in store.conductorTableHeadings" :key="heading.key">
                  <ContentEditable
                    @update:modelValue="(newValue) => onLinePropertyChange(element, heading.key, newValue)"
                    :modelValue="element[heading.key]"
                    :editable="heading.editable"
                    :customClass="['conductorTableInput']"
                    :items="heading.items"
                  />
                </td>
              </tr>
            </template>
          </draggable>
        </table>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { computed, watch } from 'vue';
import draggable from 'vuedraggable';
import { useSvgStore } from '@/stores/svgStore';
import ContentEditable from './ContentEditable.vue';

import { useHistoryStore } from '@/stores/history';

const historyStore = useHistoryStore();

const store = useSvgStore();

const { onLinePropertyChange } = store;

const selectedLine = computed(() => store.selectedLine);

const isSelected = (line) => {
  return selectedLine.value && line.id === selectedLine.value.id;
};

// Handle the drag end event to trigger any updates needed
const onDragEnd = () => {
  store.updateAliases(); // Update aliases after reordering
};
</script>

<style scoped>
.conductorTable {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* Ensures columns are fixed width */
}

.conductorTable th,
.conductorTable td {
  border: 1px solid #ccc;
  text-align: center;
  overflow: hidden; /* Hide overflow if content is too big */
}

.conductorTable th {
  background-color: #f5f5f5;
}

.conductorTableInput {
  width: 100%; /* Input fields take up full width of the cell */
}

.drag-handle {
  cursor: move;
  text-align: center;
  width: 40px;
}

.selected {
  background-color: #e0f7fa;
}
</style>
