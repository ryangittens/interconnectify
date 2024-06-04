<template>
  <v-dialog :model-value="show" @update:model-value="$emit('closeBlockDialog')" width="auto">
    <v-card
      max-width="400"
      prepend-icon="mdi-update"
      text="Your application will relaunch automatically after the update is complete."
      title="Blocks"
    >
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Ok" @click="$emit('closeBlockDialog')"></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const emit = defineEmits(['closeBlockDialog']);

const props = defineProps({
  show: Boolean
});
</script>
