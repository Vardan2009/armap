<template>
  <header>
    <h1 style="font-style: italic">ArMap</h1>
    <nav>
      <DarkModeSelector />
    </nav>
  </header>

  <button class="profile-trigger" @click="isSidebarOpen = true">
    <div class="avatar-container">
      <img
        v-if="user"
        :src="
          user.photoURL ||
          'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid
        "
        class="trigger-img"
        alt="Profile"
      />
      <UserIcon v-else class="trigger-img" />
    </div>
    <span v-if="user" class="xp-badge">50 XP</span>
  </button>

  <div ref="mapRef" class="map"></div>

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
          :href="`https://www.google.com/maps/search/?api=1&query=${selectedPoint.lat},${selectedPoint.lng}`"
        >
          <MapIcon class="inline-icon" /> Open in Google Maps
        </a>
      </div>
    </div>
  </Transition>

  <TheSidebar :isOpen="isSidebarOpen" @close="isSidebarOpen = false" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { MapIcon, UserIcon } from "@heroicons/vue/24/solid";
import DarkModeSelector from "./DarkModeSelector.vue";
import TheSidebar from "./TheSidebar.vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { armenianSites } from "./locations.js";
import { auth } from "./firebase"; // Import auth
import { onAuthStateChanged } from "firebase/auth"; // Import observer

const isSidebarOpen = ref(false);
const mapRef = ref(null);
const selectedPoint = ref(null);
const user = ref(null); // Add user state
let map;

onMounted(() => {
  // Listen for user changes to update the profile trigger
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
  });

  map = L.map(mapRef.value, {
    attributionControl: false,
    zoomControl: false,
    minZoom: 9,
    maxBounds: L.latLngBounds(
      L.latLng(41.494453696945214, 42.17876797079458),
      L.latLng(38.75356922991509, 47.77053093866839)
    ),
    maxBoundsViscosity: 1,
  }).setView([40.1772, 44.5035], 8);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    { className: "map-tiles" }
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
      map.flyTo([site.lat, site.lng], 15, { animate: true, duration: 1.5 });
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

.profile-trigger {
  position: fixed;
  top: 85px;
  left: 20px;
  background: var(--header-color);
  backdrop-filter: blur(20px);
  border: none;
  border-radius: 5px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  z-index: 1000;
  transition: inherit;
}

.profile-trigger:hover {
  transform: translateX(2px);
}

.avatar-container {
  width: 35px;
  height: 35px;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trigger-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  color: var(--text-color);
}

.xp-badge {
  font-weight: 800;
  color: var(--text-color);
  font-size: 13px;
  letter-spacing: -0.5px;
}
</style>
