<template>
  <header>
    <h1 style="font-style: italic">ArMap</h1>
    <nav>
      <DarkModeSelector />
    </nav>
  </header>

  <div ref="mapRef" class="map"></div>
  <p class="bottom-text">
    Map Data &copy;
    <a href="https://www.openstreetmap.org/copyright" target="_blank">
      OpenStreetMap contributors
    </a>
    &copy; <a href="https://carto.com/" target="_blank">CARTO</a>
  </p>

  <Transition name="slide-up">
    <div v-if="selectedPoint" class="story-card">
      <button @click="close" class="close-btn">✕</button>

      <div class="card-image-container">
        <img :src="selectedPoint.image" class="location-image" />
        <div class="image-gradient"></div>
      </div>

      <div class="card-content">
        <span class="category">{{ selectedPoint.category }}</span>
        <h2>{{ selectedPoint.name }}</h2>
        <p>{{ selectedPoint.description }}</p>

        <div class="stats">
          <div class="stat-item">🏆 50 XP</div>
          <div class="stat-item">🇦🇲 Heritage Site</div>
        </div>

        <a
          class="action-btn"
          target="_blank"
          :href="`https://www.google.com/maps/dir/?api=1&destination=${selectedPoint.lat},${selectedPoint.lng}`"
        >
          <MapIcon class="inline-icon" /> Open in Google Maps
        </a>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { MapIcon } from "@heroicons/vue/24/solid";

import DarkModeSelector from "./DarkModeSelector.vue";

import { ref, onMounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { armenianSites } from "./locations.js";

const mapRef = ref(null);
const selectedPoint = ref(null);
let map;

onMounted(() => {
  map = L.map(mapRef.value, {
    attributionControl: false,
    zoomControl: false,
    minZoom: 9,
    maxBounds: L.latLngBounds(
      L.latLng(41.494453696945214, 42.17876797079458),
      L.latLng(38.75356922991509, 47.77053093866839),
    ),
    maxBoundsViscosity: 1,
  }).setView([40.1772, 44.5035], 8);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      className: "map-tiles",
    },
  ).addTo(map);

  const clusters = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    maxClusterRadius: 25,
    disableClusteringAtZoom: 17,

    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-pulse"></div><div class="cluster-inner"><span>${count}</span></div>`,
        className: "custom-cluster-marker",
        iconSize: L.point(40, 40),
      });
    },
  });

  const createPulseIcon = () => {
    return L.divIcon({
      className: "pulse-marker",
      html: `<div class="pulse-ring"></div><div class="pulse-core"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  armenianSites.forEach((site) => {
    const marker = L.marker([site.lat, site.lng], { icon: createPulseIcon() });

    marker.on("click", () => {
      selectedPoint.value = site;
      map.flyTo([site.lat, site.lng], 15, {
        animate: true,
        duration: 1.5,
      });

      mapRef.value.classList.add("focused");
    });

    clusters.addLayer(marker);
  });

  map.addLayer(clusters);

  map.on("movestart", () => {
    mapRef.value.classList.remove("focused");
  });
});

const close = () => {
  selectedPoint.value = null;
  mapRef.value.classList.remove("focused");
};
</script>

<style>
  @import "./assets/style.css";
</style>