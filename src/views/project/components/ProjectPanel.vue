<script setup lang="ts">
// Icon Imports
import { DeviceFloppyIcon, DownloadIcon, SquarePlusIcon, LineIcon, LineDashedIcon, XIcon } from 'vue-tabler-icons';
import { useSvgStore } from '@/stores/drawing';
defineEmits(['openBlockDialog']);

const store = useSvgStore();

const setSolidBlackLine = () => {
  store.setLineType('solid');
  store.setLineColor('black');
  store.startDrawing();
};

const setSolidGreenLine = () => {
  store.setLineType('solid');
  store.setLineColor('green');
  store.startDrawing();
};

const setDashedLine = () => {
  store.setLineType('dashed');
  store.setLineColor('black');
  store.startDrawing();
};

const stopDrawing = () => {
  store.stopDrawing();
};

const isActive = (tool: string) => {
  return store.activeTool === tool;
};

const { addBlock } = store;

const addNewBlock = () => {
  const newBlock = {
    id: Date.now(),
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    color: '#f0f0f0'
  };
  addBlock(newBlock);
};
</script>

<template>
  <v-toolbar elevation="0" height="40" class="mt-n3" style="z-index: 1; background: transparent">
    <v-btn class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <DownloadIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <DeviceFloppyIcon size="17" stroke-width="1.5" />
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
      :variant="isActive('solid-green') ? 'tonal' : 'flat'"
      size="small"
    >
      <LineIcon style="color: green" size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn
      @click="setDashedLine"
      class="text-secondary ml-2"
      color="background"
      icon
      outlined
      rounded="sm"
      :variant="isActive('dashed-black') ? 'tonal' : 'flat'"
      size="small"
    >
      <LineDashedIcon style="color: black" size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="stopDrawing" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <XIcon size="17" stroke-width="1.5" />
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
      <SquarePlusIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn @click="addNewBlock" class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <SquarePlusIcon size="17" stroke-width="1.5" />
    </v-btn>
  </v-toolbar>
</template>
