<!-- <template>
  <v-expansion-panels class="conductorSchedulePanel">
    <v-expansion-panel title="Conductor Schedule">
      <v-expansion-panel-text>
        <perfect-scrollbar class="conductorScheduleTable">
          <v-data-table-virtual :headers="conductorTableHeadings" :items="store.lines" item-value="name"></v-data-table-virtual>
        </perfect-scrollbar>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template> -->

<template>
  <v-expansion-panels class="conductorSchedulePanel">
    <v-expansion-panel title="Conductor Schedule">
      <v-expansion-panel-text>
        <v-container>
          <v-row>
            <v-col md="auto" v-for="heading in conductorTableHeadings">
              <div class="text-h6">{{ heading.title }}</div>
              <!-- <v-text-field
                density="dense"
                v-model="conductor[heading.key]"
                class="conductorTableInput editable"
                v-for="conductor in testData"
              ></v-text-field> -->
              <ContentEditable
                v-for="conductor in testData"
                v-model="conductor[heading.key]"
                :editable="heading.editable"
                customClass="conductorTableInput"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
import { useSvgStore } from '@/stores/svgStore';
const store = useSvgStore();
import ContentEditable from './ContentEditable.vue';

const conductors = store.lines;

const conductorTableHeadings = [
  { title: 'RUN', key: 'run', editable: false },
  { title: 'VOLTAGE', key: 'voltage', editable: false },
  { title: 'CURRENT', key: 'current', editable: true },
  { title: 'VD', key: 'vd', editable: false },
  { title: 'CCC', key: 'ccc', editable: false },
  { title: 'EGC', key: 'egc', editable: false },
  { title: 'OCPD', key: 'ocpd', editable: false },
  { title: 'SIZE', key: 'size', editable: false },
  { title: 'CONDUCTOR', key: 'conductor', editable: false },
  { title: 'OHMS', key: 'ohms', editable: false }
];

const testData = [
  { run: 1232334, voltage: 120, current: 20, vd: 1, ccc: 3, egc: 10, ocpd: 20, size: 0.25, conductor: 35, ohms: 0.24 },
  { run: 123, voltage: 120, current: 20, vd: 1, ccc: 3, egc: 10, ocpd: 20, size: 0.25, conductor: 35, ohms: 0.24 },
  { run: 123, voltage: 120, current: 20, vd: 1, ccc: 3, egc: 10, ocpd: 20, size: 0.25, conductor: 35, ohms: 0.24 },
  { run: 123, voltage: 120, current: 20, vd: 1, ccc: 3, egc: 10, ocpd: 20, size: 0.25, conductor: 35, ohms: 0.24 },
  { run: 123, voltage: 120, current: 20, vd: 1, ccc: 3, egc: 10, ocpd: 20, size: 0.25, conductor: 35, ohms: 0.24 }
];
</script>

<style scoped>
/* Add your custom styles here */
.conductorTableInput {
  border: 1px solid #ccc;
  padding: 4px;
  display: flex;
}
.editable {
  background-color: #f9f9f9;
}
</style>
