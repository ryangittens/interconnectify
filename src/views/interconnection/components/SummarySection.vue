<template>
  <v-card elevation="0" class="innerCard maxWidth">
    <v-card-title>Summary of Your Selections</v-card-title>
    <v-card-text>
      <v-row class="d-flex justify-space-between align-start">
        <!-- Service Style -->
        <v-col cols="12" md="4">
          <h4>Service Style</h4>
          <p>{{ serviceStyleLabel }}</p>
        </v-col>
        <!-- Panel Count -->
        <v-col cols="12" md="4">
          <h4>Panel Count</h4>
          <p>{{ answers.panelCount }}</p>
        </v-col>
        <!-- Inverter Model -->
        <v-col cols="12" md="4">
          <h4>Inverter Model</h4>
          <p>{{ inverterModelLabel }}</p>
        </v-col>
        <!-- Main Breaker Rating -->
        <v-col cols="12" md="4">
          <h4>Main Breaker Rating</h4>
          <p>{{ answers.mainBreakerRating }} A</p>
        </v-col>
        <!-- Main Bus Rating -->
        <v-col cols="12" md="4">
          <h4>Main Bus Rating</h4>
          <p>{{ answers.mainBusRating }} A</p>
        </v-col>
        <!-- Additional Fields -->
        <!-- Add more fields as needed based on the user's answers -->
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { defineProps } from 'vue';

const props = defineProps({
  answers: Object,
  inverterOptions: Array, // Pass inverter options to get labels
  serviceStyleOptions: Array // Pass service style options to get labels
});

// Computed properties to get labels for selected options
const inverterModelLabel = computed(() => {
  const inverter = props.inverterOptions.find((inv) => inv.value === props.answers.inverterModel);
  return inverter ? inverter.label : 'Not selected';
});

const serviceStyleLabel = computed(() => {
  const style = props.serviceStyleOptions.find((option) => option.value === props.answers.serviceStyle);
  return style ? style.label : 'Not selected';
});
</script>

<style scoped>
.innerCard {
  margin-top: 20px;
}
</style>
