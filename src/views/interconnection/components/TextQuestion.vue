<template>
  <v-text-field :label="question.label" v-model="inputValue" />
</template>

<script setup>
import { ref, watch } from 'vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps(['question', 'answer']);
const emit = defineEmits(['answer']);
const inputValue = ref(props.answer || '');

watch(inputValue, (newValue) => {
  emit('answer', { key: props.question.key, value: newValue });
});

watch(
  () => props.answer,
  (newAnswer) => {
    inputValue.value = newAnswer;
  }
);
</script>
