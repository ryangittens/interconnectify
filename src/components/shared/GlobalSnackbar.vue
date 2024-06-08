<template>
  <v-snackbar v-model="snackbarStore.show" :color="snackbarStore.color" top right>
    {{ snackbarStore.message }}
    <template v-slot:action="{ attrs }">
      <v-btn icon v-bind="attrs" @click="snackbarStore.show = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
import { useSnackbarStore } from '@/stores/snackbar';

const snackbarStore = useSnackbarStore();
</script>
