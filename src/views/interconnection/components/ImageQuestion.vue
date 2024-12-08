<template>
  <template v-for="option in question.options" :key="option.label" style="cursor: pointer">
    <v-col>
      <v-card
        :class="['image-option', { selected: isSelected(option.value) }]"
        class="projectCard mx-auto overflow-hidden"
        max-width="688"
        min-width="244"
        @click="selectOption(option.value)"
      >
        <v-img class="align-end projectCardImage" color="lightprimary" contain :src="option.imageUrl" :alt="option.label">
          <!-- <v-btn class="" color="error" icon rounded="lg" variant="text">
              <HeartFilledIcon stroke-width="1.5" width="25" /> </v-btn
          > -->
        </v-img>
        <v-card-actions>
          <h6 class="text-subtitle-1 text-medium-emphasis font-weight-bold cursorPointer">
            {{ option.label }}
          </h6>
        </v-card-actions>
      </v-card>
    </v-col>
  </template>
</template>

<script setup>
import { ref, watch } from 'vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps(['question', 'answer']);
const emit = defineEmits(['answer']);

const selectedValue = ref(props.answer || null);

const selectOption = (value) => {
  selectedValue.value = value;
  emit('answer', { key: props.question.key, value });
};

const isSelected = (value) => selectedValue.value === value;

watch(
  () => props.answer,
  (newAnswer) => {
    selectedValue.value = newAnswer;
  }
);
</script>

<style scoped>
.image-option {
  border: 2px solid transparent;
  transition: border-color 0.3s;
}
.image-option.selected {
  border-color: rgb(var(--v-theme-primary));
}
.projectCard {
  position: relative;
  aspect-ratio: 3/4;
}

.projectCardImage {
  height: calc(100% - 44px);
}
</style>
