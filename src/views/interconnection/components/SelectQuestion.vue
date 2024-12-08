<template>
  <v-col cols="12">
    <v-select :rounded="false" :items="question.options" :label="question.label" v-model="selectedValue" />
  </v-col>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  question: Object,
  answer: [String, Number, Array, Object]
});

const emit = defineEmits(['answer']);

const selectedValue = ref(props.answer || null);

watch(selectedValue, (newValue) => {
  emit('answer', { key: props.question.key, value: newValue });
});
</script>
