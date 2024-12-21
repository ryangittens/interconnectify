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
        <template v-if="!field?.mode || field.mode === store.mode">
          <template v-if="field.inputType === 'select' || field?.options?.length">
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
              @focus="store.disableKeybindings"
              @blur="store.enableKeybindings"
            ></v-select>
          </template>
          <template v-else-if="field.inputType === 'checkbox'">
            <v-checkbox
              :rounded="false"
              :label="field.label"
              :modelValue="selectedObject[field.key]"
              @update:modelValue="handleInput(field, $event)"
              @focus="store.disableKeybindings"
              @blur="store.enableKeybindings"
            ></v-checkbox>
          </template>
          <template v-else-if="field.inputType === 'textarea'">
            <!-- New textarea input -->
            <v-textarea
              :rounded="false"
              :label="field.label"
              :modelValue="getNestedValue(selectedObject, field.key)"
              @input="handleInput(field, $event.target.value)"
              @focus="store.disableKeybindings"
              @blur="store.enableKeybindings"
            ></v-textarea>
          </template>
          <template v-else>
            <v-text-field
              :rounded="false"
              :label="field.label"
              :modelValue="getNestedValue(selectedObject, field.key)"
              :type="field.type"
              @input="handleInput(field, $event.target.value)"
              :step="field?.step"
              :max="field?.max"
              :min="field?.min"
              @focus="store.disableKeybindings"
              @blur="store.enableKeybindings"
            ></v-text-field>
          </template>
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
import { DeleteBlockCommand, DeleteLineCommand, ScaleBlockCommand, SetBlockConfigCommand } from '@/commands';

const historyStore = useHistoryStore();
const store = useSvgStore();
const { deleteObject, onLinePropertyChange } = store;

const drawer = computed(() => {
  return !store.isDrawing && selectedObject.value ? true : false;
});

const selectedObject = computed(() => store.getSelectedObject());

const scaleBlock = (element, key, newValue) => {
  let scale = { scale: newValue };
  historyStore.executeCommand(new ScaleBlockCommand(element, scale, store));
};

const updateBlockWidth = (element, key, newValue) => {
  let scale = { width: newValue };
  historyStore.executeCommand(new ScaleBlockCommand(element, scale, store));
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

const updateTextData = (element, key, newValue) => {
  store.updateTextData(newValue, element);
};

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, key) => (o ? o[key] : null), obj);
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((o, key) => (o ? o[key] : null), obj);
  if (target) {
    target[lastKey] = value;
  }
}

const drawerFields = computed(() => {
  if (selectedObject.value?.object === 'connectionPoint') {
    return [
      { label: 'Voltage', key: 'voltage', type: 'number', step: 0.01 },
      { label: 'Connection Type', key: 'connectionType', type: 'text' }
    ];
  }
  if (selectedObject.value?.object === 'image') {
    return [
      { label: 'Src', key: 'src', type: 'text' },
      { label: 'Width', key: 'width', type: 'number' },
      { label: 'Height', key: 'height', type: 'number' },
      { label: 'Opacity', key: 'opacity', type: 'number', step: 0.1, max: 1, min: 0 }
    ];
  }
  if (selectedObject.value?.object === 'text') {
    return [
      { label: 'Content', key: 'content', type: 'text' },
      { label: 'Key', key: 'key', type: 'text' },
      { label: 'Prepend', key: 'prepend', type: 'text' },
      { label: 'Append', key: 'append', type: 'text' },
      {
        label: 'Editable',
        key: 'editable',
        inputType: 'checkbox',
        mode: 'block'
      },
      { label: 'Font Size', key: 'fontSize', type: 'number', step: 1 },
      { label: 'Line Height', key: 'lineHeight', type: 'number', step: 1 },
      {
        label: 'Data Ref',
        key: 'dataRef',
        inputType: 'textarea', // Changed inputType to 'textarea'
        onUpdate: updateTextData
      }
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
        inputType: 'select',
        type: 'number',
        options: store.wireSizes, // Reference to wireSizes from store
        onUpdate: updateWireSize
      }
    ];
  }
  if (selectedObject.value?.object === 'block') {
    const fields = [
      {
        label: 'Scale',
        key: 'scale',
        type: 'number',
        step: 0.01,
        onUpdate: scaleBlock
      },
      { label: 'Width', key: 'width', type: 'number', step: 1, onUpdate: updateBlockWidth },
      {
        label: 'Config',
        key: 'selectedConfiguration',
        inputType: 'select',
        options: selectedObject.value.configurations.map((config, index) => {
          console.log({ title: config.name, value: index });
          return { title: config.name, value: index };
        }),
        onUpdate: (element, key, newValue) => {
          historyStore.executeCommand(new SetBlockConfigCommand(element, newValue, store));
        }
      },
      {
        label: 'Selectable',
        key: 'selectable',
        inputType: 'checkbox',
        mode: 'block',
        onUpdate: (element, key, newValue) => {
          store.updateComponentSelectability(element, newValue);
        }
      },
      {
        label: 'Active',
        key: 'active',
        inputType: 'checkbox',
        onUpdate: (element, key, newValue) => {
          store.updateComponentState(element, newValue);
        }
      }
    ];

    console.log(selectedObject.value);

    // Get the current configuration of the selected block
    const configuration = selectedObject.value.configurations[selectedObject.value.selectedConfiguration];

    // Check if editableTexts exist in the configuration
    if (configuration.editableTexts && configuration.editableTexts.length > 0) {
      // Iterate over each editableText and add it to the fields array
      configuration.editableTexts.forEach((text, textIndex) => {
        console.log(selectedObject.value.configurations[selectedObject.value.selectedConfiguration].editableTexts[textIndex].content);
        fields.push({
          label: text.key || 'Text',
          key: `configurations.${selectedObject.value.selectedConfiguration}.editableTexts.${textIndex}.content`,
          type: 'text',
          onUpdate: (element, key, newValue) => {
            setNestedValue(element, key, newValue);
          }
        });
      });
    }
    return fields;
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
