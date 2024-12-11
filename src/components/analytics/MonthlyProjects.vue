<template>
  <div id="monthly_chart" style="height: 100%"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// Define props using defineProps()
const props = defineProps({
  monthlyData: {
    type: Array,
    required: true,
  },
});

// Reactive variables
let monthlyChartRoot = null;

// Function to initialize the chart
function initializeMonthlyChart() {
  // Dispose of any existing chart to avoid duplication
  if (monthlyChartRoot) {
    monthlyChartRoot.dispose();
  }

  let root = am5.Root.new("monthly_chart");
  monthlyChartRoot = root;

  // Set themes
  root.setThemes([am5themes_Animated.new(root)]);

  // Create chart
  let chart = root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: false,
      panY: false,
      wheelX: "none",
      wheelY: "none",
      paddingLeft: 0,
      paddingBottom: 50, // Add padding to the bottom here
    })
  );

  // Hide zoom-out button during animation
  chart.zoomOutButton.set("forceHidden", true);

  // Create X-axis (for months)
  let xRenderer = am5xy.AxisRendererX.new(root, {
    minGridDistance: 30,
  });
  xRenderer.grid.template.set("location", 0);

  let xAxis = chart.xAxes.push(
    am5xy.CategoryAxis.new(root, {
      categoryField: "month",
      renderer: xRenderer,
    })
  );

  // Create Y-axis (for project count)
  let yAxis = chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      min: 0,
      numberFormatter: am5.NumberFormatter.new(root, {
        numberFormat: "#,###a",
      }),
      renderer: am5xy.AxisRendererY.new(root, {
        strokeOpacity: 0.1,
      }),
    })
  );

  // Add series for the bars
  let series = chart.series.push(
    am5xy.ColumnSeries.new(root, {
      name: "Projects",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "count",
      categoryXField: "month",
      tooltip: am5.Tooltip.new(root, {
        pointerOrientation: "horizontal",
        labelText: "{valueY}",
      }),
    })
  );

  // Rounded corners for columns
  series.columns.template.setAll({
    cornerRadiusTL: 5,
    cornerRadiusTR: 5,
    strokeOpacity: 0,
  });

  // Set column fill color
  series.columns.template.setAll({
    fill: am5.color("#01A2DE"),
  });

  // Set the data
  let data = props.monthlyData;

  xAxis.data.setAll(data);
  series.data.setAll(data);

  // Add cursor (optional, enhances tooltip interaction)
  chart.set(
    "cursor",
    am5xy.XYCursor.new(root, {
      behavior: "none",
      xAxis: xAxis,
      yAxis: yAxis,
    })
  );

  // Make the chart and series appear with animation
  series.appear(1000);
  chart.appear(1000, 100);
}

// Mounted and beforeUnmount hooks
onMounted(() => {
  if (props.monthlyData && props.monthlyData.length > 0) {
    initializeMonthlyChart();
  }
});

onBeforeUnmount(() => {
  if (monthlyChartRoot) {
    monthlyChartRoot.dispose();
  }
});

// Watch for changes in the props and re-initialize the chart
watch(
  () => props.monthlyData,
  (newMonthlyData) => {
    if (newMonthlyData && newMonthlyData.length > 0) {
      initializeMonthlyChart();
    }
  },
  { immediate: true, deep: true }
);
</script>
