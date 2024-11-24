<template>
  <span
    v-if="!items || !items.length"
    :contenteditable="editable"
    class="tableValue"
    :class="[...customClass, { editable }]"
    @input="onInput"
    @blur="onBlur"
  >
    {{ modelValue }}
  </span>

  <select v-else class="tableValue" :class="[...customClass, { editable }]" @change="onSelectChange" :value="modelValue">
    <option disabled value="">Select an option</option>
    <option v-for="item in items" :key="item" :value="item">
      {{ item }}
    </option>
  </select>
</template>

<script setup>
import { ref, watch } from 'vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  editable: Boolean,
  customClass: {
    type: Array,
    default: () => []
  },
  items: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const localValue = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newVal) => {
    localValue.value = newVal;
  }
);

const onInput = (event) => {
  localValue.value = event.target.innerText;
  emit('update:modelValue', localValue.value);
};

const onBlur = () => {
  emit('update:modelValue', localValue.value);
};

const onSelectChange = (event) => {
  localValue.value = event.target.value;
  emit('update:modelValue', localValue.value);
};
</script>

<style scoped>
/* Add your custom styles here */
.editable {
  background-color: #f9f9f9;
}
.selected {
  background-color: rgba(var(--v-theme-primary), var(--v-activated-opacity));
}
.tableValue {
  display: block;
}
select.tableValue {
  width: 100%;
  padding: 4px;
  font-size: 14px;
}
</style>
