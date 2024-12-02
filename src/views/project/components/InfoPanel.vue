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
        <!-- Conditionally render v-select if options exist, else render v-text-field -->
        <template v-if="field.options">
          <v-select
            :rounded="false"
            :label="field.label"
            :items="field.options"
            :modelValue="selectedObject[field.key]"
            @update:modelValue="handleInput(field, $event)"
            :multiple="field.multiple || false"
            :clearable="field.clearable || false"
            :disabled="field.disabled || false"
            class="w-100"
          ></v-select>
        </template>
        <template v-else>
          <v-text-field
            :rounded="false"
            :label="field.label"
            :modelValue="selectedObject[field.key]"
            :type="field.type"
            @input="handleInput(field, $event.target.value)"
            :step="field?.step"
          ></v-text-field>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useSvgStore } from '@/stores/svgStore';
import { computed } from 'vue';
import { TrashXIcon } from 'vue-tabler-icons';
import { useHistoryStore } from '@/stores/history';
import { DeleteBlockCommand, DeleteLineCommand, ScaleBlockCommand } from '@/commands';

const historyStore = useHistoryStore();
const store = useSvgStore();
const { deleteObject, onLinePropertyChange } = store;

const drawer = computed(() => {
  return !store.isDrawing && selectedObject.value ? true : false;
});

const selectedObject = computed(() => store.getSelectedObject());

const scaleBlock = (element, key, newValue) => {
  historyStore.executeCommand(new ScaleBlockCommand(element, newValue, store));
};

const updateLine = (element, key, newValue) => {
  onLinePropertyChange(element, key, newValue);
};

const updateWireSize = (element, key, newValue) => {
  onLinePropertyChange(element, key, newValue);
};

const handleInput = (field, newValue) => {
  const element = selectedObject.value;
  const key = field.key;

  // Call the onUpdate function if it exists
  if (field.onUpdate) {
    field.onUpdate(element, key, newValue);
  } else {
    // Update the value in selectedObject
    element[key] = newValue;
  }
};

const handleBlur = () => {
  // Optional: Implement any onBlur logic if necessary
};

const drawerFields = computed(() => {
  if (selectedObject.value?.object === 'connectionPoint') {
    return [
      { label: 'Voltage', key: 'voltage', type: 'number', step: 0.01 },
      { label: 'Connection Type', key: 'connectionType', type: 'text' }
    ];
  }
  if (selectedObject.value?.object === 'text') {
    return [
      { label: 'Content', key: 'content', type: 'text' },
      { label: 'Font Size', key: 'fontSize', type: 'number', step: 1 }
    ];
  }
  if (selectedObject.value?.object === 'line') {
    return [
      {
        label: 'Voltage',
        key: 'voltage',
        type: 'text',
        onUpdate: updateLine
      },
      {
        label: 'Current',
        key: 'current',
        type: 'text',
        onUpdate: updateLine
      },
      {
        label: 'Size',
        key: 'size',
        type: 'number',
        options: store.wireSizes, // Reference to wireSizes from store
        onUpdate: updateWireSize
      }
    ];
  }
  if (selectedObject.value?.object === 'block') {
    return [
      {
        label: 'Scale',
        key: 'scale',
        type: 'number',
        step: 0.01,
        onUpdate: scaleBlock
      }
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
.w-100 {
  width: 100%;
}
</style>
