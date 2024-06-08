<script setup lang="ts">
// Icon Imports
import {
  DeviceFloppyIcon,
  DownloadIcon,
  SquarePlusIcon,
  LineIcon,
  LineDashedIcon,
  XIcon,
  Category2Icon,
  CircuitGroundIcon,
  ArrowBackUpIcon,
  ArrowForwardUpIcon,
  Focus2Icon
} from 'vue-tabler-icons';
import { useSvgStore } from '@/stores/svgStore';
import { ref } from 'vue';
import { supabase } from '@/utils/supabaseClient';
import { useHistoryStore } from '@/stores/history';
import { DeleteBlockCommand, DeleteLineCommand, AddBlockCommand } from '@/commands';

import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();

const store = useSvgStore();
const historyStore = useHistoryStore();

defineEmits(['openBlockDialog']);
const props = defineProps(['project']);
const project = props.project;
const projectId = project.id;

const error = ref(null);

const setSolidBlackLine = () => {
  store.setLineType('solid');
  store.setLineColor('black');
  store.startDrawing();
};

const setSolidGreenLine = () => {
  store.setLineType('solid');
  store.setLineColor('#11dd01');
  store.startDrawing();
};

const setDashedLine = () => {
  store.setLineType('dashed');
  store.setLineColor('#636363');
  store.startDrawing();
};

const deleteObject = () => {
  if (store.selectedBlock) {
    historyStore.executeCommand(new DeleteBlockCommand(store.selectedBlock, store));
  }
  if (store.selectedLine) {
    historyStore.executeCommand(new DeleteLineCommand(store.selectedLine, store));
  }
};

const isActive = (tool: string) => {
  return store.activeTool === tool;
};

const { addBlock } = store;

const addNewBlock = () => {
  const newBlock = {
    object: 'block',
    id: Date.now(),
    x: 40,
    y: 40,
    width: 80,
    height: 80,
    color: '#f0f0f0',
    //content: '<circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />',
    connectionPoints: [
      { id: 'cp1', x: 40, y: 0 }, // Top-center
      { id: 'cp2', x: 40, y: 80 }, // Bottom-center
      { id: 'cp3', x: 0, y: 40 }, // Left-center
      { id: 'cp4', x: 80, y: 40 } // Right-center
    ]
  };
  historyStore.executeCommand(new AddBlockCommand(newBlock, store));
};

const serializeState = () => {
  return store.serializeState();
};

const svgToDataUrl = (svgElement: any) => {
  return store.svgToDataUrl(svgElement);
};

const undo = () => {
  return historyStore.undo();
};

const redo = () => {
  return historyStore.redo();
};

const centerSvg = () => {
  return store.centerSVG();
};

const fitSVGToExtent = () => {
  return store.fitSVGToExtent();
};

const saveDrawing = async () => {
  try {
    const drawing = serializeState();
    const { data, error: updateError } = await supabase.from('projects').update({ drawing }).eq('id', projectId);

    if (updateError) {
      throw updateError;
    }

    snackbarStore.showSnackbar('Drawing Saved Successfully', 'success');
  } catch (err: any) {
    error.value = err.message;
    snackbarStore.showSnackbar('Error Saving Drawing', 'error');
  }
  try {
    const project_svg = svgToDataUrl(store.svg);
    const { data, error: updateError } = await supabase.from('projects').update({ project_svg }).eq('id', projectId);

    if (updateError) {
      throw updateError;
    }

    snackbarStore.showSnackbar('Drawing Saved Successfully', 'success');
  } catch (err: any) {
    error.value = err.message;
    snackbarStore.showSnackbar('Error Saving Drawing', 'error');
  }
};
</script>

<template>
  <v-toolbar elevation="0" height="40" class="mt-n3" style="z-index: 1; background: transparent">
    <v-btn class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <DownloadIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="saveDrawing" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <DeviceFloppyIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="undo" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <ArrowBackUpIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="redo" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <ArrowForwardUpIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="fitSVGToExtent" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <Focus2Icon size="17" stroke-width="1.5" />
    </v-btn>
    <v-spacer />
    <v-btn
      @click="setSolidBlackLine"
      class="text-secondary ml-2"
      color="background"
      icon
      outlined
      rounded="sm"
      :variant="isActive('solid-black') ? 'tonal' : 'flat'"
      size="small"
    >
      <LineIcon style="color: black" size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="setSolidGreenLine"
      class="text-secondary ml-2"
      color="background"
      icon
      outlined
      rounded="sm"
      :variant="isActive('solid-#11dd01') ? 'tonal' : 'flat'"
      size="small"
    >
      <CircuitGroundIcon style="color: green" size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="setDashedLine"
      class="text-secondary ml-2"
      color="background"
      icon
      outlined
      rounded="sm"
      :variant="isActive('dashed-#636363') ? 'tonal' : 'flat'"
      size="small"
    >
      <LineDashedIcon style="color: black" size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="deleteObject" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <XIcon size="17" color="red" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="$emit('openBlockDialog')"
      class="text-secondary ml-2"
      color="background"
      icon
      outlined
      rounded="sm"
      variant="flat"
      size="small"
    >
      <Category2Icon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="addNewBlock" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <SquarePlusIcon size="17" stroke-width="1.5" />
    </v-btn>
  </v-toolbar>
</template>
