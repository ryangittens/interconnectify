<script setup lang="ts">
import { ref } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
// Icon Imports
import { DeviceFloppyIcon, DownloadIcon, SquarePlusIcon, LineIcon } from 'vue-tabler-icons';
defineEmits(['openBlockDialog']);
</script>

<template>
  <v-toolbar elevation="0" height="40" class="mt-n3" style="z-index: 1; background: transparent">
    <v-btn class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <DownloadIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-btn class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <DeviceFloppyIcon size="17" stroke-width="1.5" />
    </v-btn>
    <v-spacer /><v-btn class="text-secondary ml-2" color="background" icon outlined rounded="sm" variant="flat" size="small">
      <LineIcon size="17" stroke-width="1.5" />
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
  </v-toolbar>
</template>
