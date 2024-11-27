<!-- InterconnectionQuestion.vue -->
<template>
  <div>
    <h3>{{ question.label }}</h3>
    <v-row>
      <v-col
        v-for="option in interconnectionOptions"
        :key="option.value"
        cols="12"
        md="6"
        @click="selectOption(option)"
        :class="{ selected: isSelected(option) }"
      >
        <v-card class="pa-3">
          <v-img :src="getImageUrl(option.illustration)" height="200px"></v-img>
          <v-card-title>{{ option.label }}</v-card-title>
          <v-card-text>{{ option.desc }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps(['question', 'answer']);
const emit = defineEmits(['answer']);

const interconnectionOptions = props.question.interconnectionOptions;
const selectedOption = ref(props.answer || null);

const selectOption = (option) => {
  selectedOption.value = option.value;
  emit('answer', { key: props.question.key, value: option.value });
};

const isSelected = (option) => selectedOption.value === option.value;

const getImageUrl = (illustration) => {
  // Replace with your logic to get the image URL
  return `path_to_images/${illustration}.png`;
};
</script>

<style scoped>
.selected {
  border: 2px solid var(--v-primary-base);
}
</style>
