<template>
  <header>
    <h1 style="font-style: italic">ArMap</h1>
  </header>

  <div ref="mapRef" class="map"></div>
  
  <Transition name="slide-up">
    <div v-if="selectedPoint" class="story-card">
      <div class="drag-handle"></div>
      <button @click="selectedPoint = null" class="close-btn">✕</button>
      
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
        
        <button class="action-btn">Open Gallery</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Cluster Plugin imports
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { armenianSites } from "./locations.js";

const mapRef = ref(null);
const selectedPoint = ref(null);
let map;

onMounted(() => {
  // 1. Setup the Map (Center on Armenia)
  map = L.map(mapRef.value, {
    attributionControl: false,
    zoomControl: false,
  }).setView([40.1772, 44.5035], 8);

  // 2. Light Gray Tile Layer
  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png").addTo(map);

  // 3. Snapchat-Style Cluster Settings
  const clusters = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    // THE DISTANCE CONTROL: Merge markers even if they are 150 pixels apart
    maxClusterRadius: 25, 
    disableClusteringAtZoom: 17,
    
    // Custom Cluster Bubble Appearance
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-pulse"></div><div class="cluster-inner"><span>${count}</span></div>`,
        className: 'custom-cluster-marker',
        iconSize: L.point(40, 40),
      });
    }
  });

  // 4. Individual Pulsing Marker Icon
  const createPulseIcon = () => {
    return L.divIcon({
      className: 'pulse-marker',
      html: `<div class="pulse-ring"></div><div class="pulse-core"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  // 5. Add our 60+ Sites to the Clusters
  armenianSites.forEach((site) => {
    const marker = L.marker([site.lat, site.lng], { icon: createPulseIcon() });

    marker.on('click', () => {
      selectedPoint.value = site;
      map.flyTo([site.lat, site.lng], 15, {
        animate: true,
        duration: 1.5
      });
    });

    clusters.addLayer(marker);
  });

  map.addLayer(clusters);
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;700&display=swap");

body, html, #app {
  margin: 0; padding: 0; height: 100%;
  font-family: "Google Sans", sans-serif;
  overflow: hidden;
}

header {
  width: 100%; height: 60px;
  display: flex; justify-content: center; align-items: center;
  position: absolute; top: 0; z-index: 1000;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.map { height: 100%; width: 100%; position: absolute; z-index: 0; }

/* --- MARKER & CLUSTER STYLE --- */
.pulse-marker { display: flex; justify-content: center; align-items: center; }
.pulse-core {
  width: 12px; height: 12px; background: #ff3b30;
  border: 2px solid white; border-radius: 50%; z-index: 10;
}
.pulse-ring {
  position: absolute; width: 35px; height: 35px;
  background: rgba(255, 59, 48, 0.4); border-radius: 50%;
  animation: pulse-animation 2s infinite;
}
@keyframes pulse-animation {
  0% { transform: scale(0.4); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}

.custom-cluster-marker { display: flex; justify-content: center; align-items: center; }
.cluster-inner {
  width: 35px; height: 35px; background: #007aff;
  border: 2px solid white; border-radius: 50%;
  color: white; font-weight: bold; display: flex;
  align-items: center; justify-content: center; z-index: 10;
}
.cluster-pulse {
  position: absolute; width: 55px; height: 55px;
  background: rgba(0, 122, 255, 0.2); border-radius: 50%;
  animation: cluster-glow 2s infinite;
}
@keyframes cluster-glow {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.2; }
}

/* --- GOOGLE MAPS STYLE CARD --- */
.story-card {
  position: absolute; bottom: 20px; left: 15px; right: 15px;
  background: white; z-index: 2000; border-radius: 28px;
  padding: 20px; box-shadow: 0 15px 50px rgba(0,0,0,0.25);
  max-width: 500px; margin: 0 auto;
}

/* --- UPDATED IMAGE STYLING --- */
.card-image-container {
  width: calc(100% + 40px); 
  margin: -20px -20px 15px -20px;
  /* Use aspect-ratio instead of fixed height for a modern look */
  aspect-ratio: 16 / 9; 
  overflow: hidden; 
  border-radius: 28px 28px 0 0;
  position: relative;
  background: #f0f0f2; /* Placeholder color while loading */
}

.location-image { 
  width: 100%; 
  height: 100%; 
  /* 'cover' ensures the image fills the area without stretching */
  /* 'center' keeps the subject of the photo in the middle */
  object-fit: cover; 
  object-position: center;
  display: block;
}

/* Subtle loading state to handle different sizes gracefully */
.location-image[src=""] {
  visibility: hidden;
}

.image-gradient {
  position: absolute; bottom: 0; width: 100%; height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.2), transparent);
}

.category { color: #ff3b30; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }

.stats { display: flex; gap: 10px; margin: 15px 0; }
.stat-item { background: #f5f5f7; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; }

.action-btn {
  width: 100%; background: #007aff; color: white; border: none;
  padding: 14px; border-radius: 18px; font-weight: bold; font-size: 16px;
  transition: transform 0.2s;
}
.action-btn:active { transform: scale(0.98); }

.close-btn {
  position: absolute; top: 15px; right: 15px; border: none;
  background: rgba(255,255,255,0.9); width: 32px; height: 32px;
  border-radius: 50%; z-index: 2001; font-weight: bold;
}

.drag-handle {
  width: 40px; height: 4px; background: rgba(0,0,0,0.1);
  border-radius: 10px; margin: -10px auto 10px;
}

/* --- TRANSITIONS --- */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(110%); opacity: 0; }
</style>