<template>
    <div id="jurisdiction_chart" style="height: 100%"></div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount, watch } from "vue";
  import * as am5 from "@amcharts/amcharts5";
  import * as am5xy from "@amcharts/amcharts5/xy";
  import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
  
  // Define props using defineProps()
  const props = defineProps({
    jurisdictionsData: {
      type: Array,
      required: true,
    },
    statesData: {
      type: Array,
      required: true,
    },
  });
  
  // Reactive variables
  let jurisdictionChartRoot = null;
  const currentChartType = ref("jurisdictions");
  
  // Function to initialize the chart
  function initializeJurisdictionChart() {
    // Dispose of any existing chart to avoid duplication
    if (jurisdictionChartRoot) {
      jurisdictionChartRoot.dispose();
    }
  
    let root = am5.Root.new("jurisdiction_chart");
    jurisdictionChartRoot = root;
  
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
  
    // Create Y-axis (for jurisdictions or states)
    let yRenderer = am5xy.AxisRendererY.new(root, {
      minGridDistance: 30,
      minorGridEnabled: true,
    });
    yRenderer.grid.template.set("location", 1);
  
    let yAxis = chart.yAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0,
        categoryField: "jurisdiction",
        renderer: yRenderer,
      })
    );
  
    // Create X-axis (for project count)
    let xAxis = chart.xAxes.push(
      am5xy.ValueAxis.new(root, {
        maxDeviation: 0,
        min: 0,
        numberFormatter: am5.NumberFormatter.new(root, {
          numberFormat: "#,###a",
        }),
        extraMax: 0.1,
        renderer: am5xy.AxisRendererX.new(root, {
          strokeOpacity: 0.1,
          minGridDistance: 80,
        }),
      })
    );
  
    // Add series for the bars
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Series 1",
        xAxis: xAxis,
        yAxis: yAxis,
        valueXField: "count",
        categoryYField: "jurisdiction",
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: "left",
          labelText: "{valueX}",
        }),
      })
    );
  
    // Rounded corners for columns
    series.columns.template.setAll({
      cornerRadiusTR: 5,
      cornerRadiusBR: 5,
      strokeOpacity: 0,
    });
  
    // Reversed color scale from dark to light shades of #01A2DE
    const colorScale = [
      am5.color("#01A2DE"), // Darkest shade
      am5.color("#1AB2E0"),
      am5.color("#33B9E3"),
      am5.color("#4DC3E7"),
      am5.color("#66C9EB"),
      am5.color("#80D4EF"),
      am5.color("#99DFF3"),
      am5.color("#B3E5F6"),
      am5.color("#CCEAF8"),
      am5.color("#E0F6FB"), // Lightest shade
    ];
  
    // Color each column based on index, with a gradient from dark to light
    series.columns.template.adapters.add("fill", (fill, target) => {
      let index = series.columns.indexOf(target);
      return colorScale[index % colorScale.length]; // Apply cyclic color scale
    });
  
    series.columns.template.adapters.add("stroke", (stroke, target) => {
      let index = series.columns.indexOf(target);
      return colorScale[index % colorScale.length];
    });
  
    // Set the data
    let data =
      currentChartType.value === "jurisdictions"
        ? props.jurisdictionsData
        : props.statesData;
  
    yAxis.data.setAll(data);
    series.data.setAll(data);
  
    // Sort the axis to make the largest values show at the top
    sortCategoryAxis(series, yAxis);
  
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
  
    // Add buttons into the chart to toggle between jurisdictions and states
    let buttonsContainer = chart.children.push(
      am5.Container.new(root, {
        x: am5.p50,
        centerX: am5.p50,
        y: am5.p100,
        dy: 50,
        centerY: am5.p100,
        layout: root.horizontalLayout,
        paddingTop: 5,
        paddingRight: 8,
        paddingLeft: 8,
        background: am5.RoundedRectangle.new(root, {
          fill: am5.color(0xffffff),
          fillOpacity: 0.3,
        }),
      })
    );
  
    function createButton(text, chartType) {
      let button = buttonsContainer.children.push(
        am5.Button.new(root, {
          paddingTop: 3,
          paddingRight: 10,
          paddingBottom: 3,
          paddingLeft: 10,
          marginLeft: 5,
          marginRight: 5,
          label: am5.Label.new(root, {
            text: text,
            fontSize: "14px",
            fill: am5.color(
              chartType === currentChartType.value ? 0xffffff : 0x000000
            ),
          }),
          background: am5.RoundedRectangle.new(root, {
            fill: am5.color(
              chartType === currentChartType.value ? 0x01a2de : 0xeaeaea
            ),
          }),
        })
      );
  
      button.events.on("click", function () {
        if (currentChartType.value !== chartType) {
          currentChartType.value = chartType;
          initializeJurisdictionChart();
        }
      });
    }
  
    createButton("Top Jurisdictions", "jurisdictions");
    createButton("Top States", "states");
  }
  
  // Function to sort the Y-axis by the values in descending order
  function sortCategoryAxis(series, yAxis) {
    series.dataItems.sort((x, y) => y.get("valueX") - x.get("valueX"));
  
    am5.array.each(yAxis.dataItems, (dataItem) => {
      let seriesDataItem = getSeriesItem(series, dataItem.get("categoryY"));
      if (seriesDataItem) {
        let index = series.dataItems.indexOf(seriesDataItem);
        let deltaPosition =
          (index - dataItem.get("index", 0)) / series.dataItems.length;
        dataItem.set("index", index);
        dataItem.set("deltaPosition", -deltaPosition);
        dataItem.animate({
          key: "deltaPosition",
          to: 0,
          duration: 1000,
          easing: am5.ease.out(am5.ease.cubic),
        });
      }
    });
  
    yAxis.dataItems.sort((x, y) => x.get("index") - y.get("index"));
  }
  
  // Helper function to get a series item by category
  function getSeriesItem(series, category) {
    for (let i = 0; i < series.dataItems.length; i++) {
      let dataItem = series.dataItems[i];
      if (dataItem.get("categoryY") === category) {
        return dataItem;
      }
    }
  }
  
  // Mounted and beforeUnmount hooks
  onMounted(() => {
    if (
      (props.jurisdictionsData && props.jurisdictionsData.length > 0) ||
      (props.statesData && props.statesData.length > 0)
    ) {
      initializeJurisdictionChart();
    }
  });
  
  onBeforeUnmount(() => {
    if (jurisdictionChartRoot) {
      jurisdictionChartRoot.dispose();
    }
  });
  
  // Watch for changes in the props and re-initialize the chart
  watch(
    () => [props.jurisdictionsData, props.statesData],
    ([newJurisdictionsData, newStatesData]) => {
      if (
        (newJurisdictionsData && newJurisdictionsData.length > 0) ||
        (newStatesData && newStatesData.length > 0)
      ) {
        initializeJurisdictionChart();
      }
    },
    { immediate: true, deep: true }
  );
  </script>
  