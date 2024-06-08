<template>
  <v-expansion-panels class="conductorSchedulePanel">
    <v-expansion-panel title="Conductor Schedule">
      <v-expansion-panel-text>
        <perfect-scrollbar class="conductorScheduleTable">
          <v-data-table-virtual :headers="conductorTableHeadings" :items="store.lines" item-value="name"></v-data-table-virtual>
        </perfect-scrollbar>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { useSvgStore } from '@/stores/svgStore';
const store = useSvgStore();

const conductorTableHeadings = [
  { title: 'RUN', align: 'start', key: 'name' },
  { title: 'VOLTAGE', align: 'end', key: 'length' },
  { title: 'CURRENT', align: 'end', key: 'speed' },
  { title: 'VD', align: 'end', key: 'speed' },
  { title: 'CCC', align: 'end', key: 'speed' },
  { title: 'EGC', align: 'end', key: 'speed' },
  { title: 'OCPD', align: 'end', key: 'speed' },
  { title: 'SIZE', align: 'end', key: 'speed' },
  { title: 'CONDUCTOR', align: 'end', key: 'speed' },
  { title: 'OHMS', align: 'end', key: 'price' }
];
</script>
