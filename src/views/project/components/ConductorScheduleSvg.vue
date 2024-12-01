<template>
  <g
    :transform="`translate(${currentX}, ${currentY})`"
    @click="isDragging ? null : store.openConductorSchedulePanel()"
    @mousedown.stop="startDrag"
    @touchstart.stop="startDrag"
    v-html="svgTableContent"
    style="cursor: grab"
  ></g>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import SVGTable from '@shjeon0730/svg-table-vanilla';
import { useSvgStore } from '@/stores/svgStore';

const props = defineProps({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: { type: Number, default: 1100 } // Adjust as needed
});

const { x, y, width } = props;

const store = useSvgStore();
const svgTableContent = ref('');

const currentX = ref(x);
const currentY = ref(y);
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const generateSvgTable = () => {
  // Prepare table rows
  const rows = [
    // Header row
    {
      cells: store.conductorTableHeadings.map((heading) => ({
        content: heading.title.toUpperCase()
      }))
    },
    // Data rows
    ...store.wireRuns.map((line) => ({
      cells: store.conductorTableHeadings.map((heading) => ({
        content: line[heading.key]?.toString() || ''
      }))
    }))
  ];

  // Define table properties
  const tableProps = {
    rows,
    defaultCellStyle: {
      paddings: [4, 4, 0, 0],
      textColor: '#000',
      textStyle: {
        textAnchor: 'middle',
        dominantBaseline: 'auto',
        fontSize: 9
      }
    },
    rowHeights: rows.map(() => 12)
  };

  // Generate SVG table as a string
  return SVGTable({ ...tableProps, width });
};

// Generate the SVG table content initially
onMounted(() => {
  svgTableContent.value = generateSvgTable();
});

// Update SVG table when data changes
watch(
  () => [store.wireRuns, store.conductorTableHeadings],
  () => {
    svgTableContent.value = generateSvgTable();
  },
  { deep: true }
);

const startDrag = (event) => {
  isDragging.value = true;
  dragStart.value = {
    x: event.clientX || event.touches[0].clientX,
    y: event.clientY || event.touches[0].clientY
  };
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('touchmove', onDrag);
  window.addEventListener('touchend', endDrag);
};

const onDrag = (event) => {
  if (!isDragging.value) return;

  const clientX = event.clientX || event.touches[0].clientX;
  const clientY = event.clientY || event.touches[0].clientY;

  const dx = clientX - dragStart.value.x;
  const dy = clientY - dragStart.value.y;

  currentX.value += dx;
  currentY.value += dy;

  dragStart.value = { x: clientX, y: clientY };
};

const endDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchmove', onDrag);
  window.removeEventListener('touchend', endDrag);
};
</script>

<style scoped>
.dragging {
  cursor: grabbing;
}

g {
  cursor: grab;
  user-select: none;
}
</style>
