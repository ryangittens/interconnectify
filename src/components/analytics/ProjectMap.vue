<template>
    <div id="summary_map" style="height: 100%"></div>
  </template>
  
  <script setup>
  import { onMounted, onBeforeUnmount, watch } from "vue";
  import * as am5 from "@amcharts/amcharts5";
  import * as am5map from "@amcharts/amcharts5/map";
  import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
  import am5geodata_usaLow from "@amcharts/amcharts5-geodata/usaLow";
  
  // Define props using defineProps()
  const props = defineProps({
    items: {
      type: Array,
      required: true,
    },
    totalProposals: {
      type: Number,
      required: true,
    },
  });
  
  // Reference to the map root
  let mapRoot = null;
  
  // Function to initialize the map
  function initializeMap() {
    // Dispose of any existing map to avoid duplication
    if (mapRoot) {
      mapRoot.dispose();
    }
  
    let root = am5.Root.new("summary_map");
    mapRoot = root;
  
    root.setThemes([am5themes_Animated.new(root)]);
  
    let chart = root.container.children.push(
      am5map.MapChart.new(root, {
        projection: am5map.geoAlbersUsa(),
      })
    );
  
    let polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_usaLow,
      })
    );
  
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}",
      interactive: true,
      fill: am5.color(0xeaeaea), // Set land color to white
      stroke: am5.color(0xffffff), // Border between states
      strokeWidth: 0.5, // Line width for state borders
    });
  
    polygonSeries.mapPolygons.template.states.create("hover", {
      fill: am5.color(0x8adbf9),
    });
  
    // Create a clustered point series
    let pointSeries = chart.series.push(
      am5map.ClusteredPointSeries.new(root, {})
    );
  
    pointSeries.bullets.push(() => {
      let circle = am5.Circle.new(root, {
        radius: 6,
        fill: am5.color(0x01a2de),
        tooltipText: "{project_name}",
      });
  
      return am5.Bullet.new(root, {
        sprite: circle,
      });
    });
  
    pointSeries.set("clusteredBullet", function (root) {
      let container = am5.Container.new(root, { cursorOverStyle: "pointer" });
  
      let circle1 = container.children.push(
        am5.Circle.new(root, {
          radius: 8,
          tooltipY: 0,
          fill: am5.color(0x01a2de),
        })
      );
  
      let circle2 = container.children.push(
        am5.Circle.new(root, {
          radius: 12,
          fillOpacity: 0.3,
          tooltipY: 0,
          fill: am5.color(0x01a2de),
        })
      );
  
      let circle3 = container.children.push(
        am5.Circle.new(root, {
          radius: 16,
          fillOpacity: 0.3,
          tooltipY: 0,
          fill: am5.color(0x01a2de),
        })
      );
  
      let label = container.children.push(
        am5.Label.new(root, {
          centerX: am5.p50,
          centerY: am5.p50,
          fill: am5.color(0xffffff),
          populateText: true,
          fontSize: "8",
          text: "{value}",
        })
      );
  
      container.events.on("click", function (e) {
        pointSeries.zoomToCluster(e.target.dataItem);
      });
  
      return am5.Bullet.new(root, {
        sprite: container,
      });
    });
  
    // Prepare project locations data
    let projectLocations = props.items
      .filter((item) => item.lat && item.lng)
      .map((item) => ({
        project_name: item.project_name,
        geometry: {
          type: "Point",
          coordinates: [item.lng, item.lat],
        },
      }));
  
    pointSeries.data.setAll(projectLocations);
  
    chart.children.push(
      am5.Label.new(root, {
        text: `Total Projects: ${props.totalProposals}`, // Dynamic text for total projects
        x: am5.p0, // Positioning at the top left
        y: am5.p0,
        paddingTop: 10,
        paddingLeft: 10,
        fontSize: "20px",
        fill: am5.color(0x000000), // Black text color
      })
    );
  }
  
  // Watch for changes in the props and re-initialize the map
  watch(
    () => [props.items, props.totalProposals],
    () => {
      if (props.items.length > 0) {
        initializeMap();
      }
    },
    { immediate: true, deep: true }
  );
  
  // Mounted and beforeUnmount hooks
  onMounted(() => {
    if (props.items.length > 0) {
      initializeMap();
    }
  });
  
  onBeforeUnmount(() => {
    if (mapRoot) {
      mapRoot.dispose();
    }
  });
  </script>
  