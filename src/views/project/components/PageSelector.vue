<template>
  <v-slide-group v-model="store.pageIndex" class="pa-0" center-active show-arrows mandatory>
    <v-slide-group-item v-for="n in store.pageOptions" :key="n" v-slot="{ isSelected, toggle }">
      <v-btn :color="isSelected ? 'primary' : undefined" class="ma-2" rounded @click="toggle"> {{ n.name }} </v-btn>
    </v-slide-group-item>
    <v-slide-group-item>
      <v-btn :color="isSelected ? 'primary' : undefined" class="ma-2" rounded>
        <IconPlus size="20" stroke-width="1.5" />
      </v-btn>
    </v-slide-group-item>
  </v-slide-group>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { IconPlus } from '@tabler/icons-vue';

const store = useSvgStore();

const emit = defineEmits(['update:pageIndex']);
</script>
