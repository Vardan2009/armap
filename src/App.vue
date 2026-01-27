<template>
  <header>
    <h1 class="logo">ArMap</h1>
    <nav>
      <DarkModeSelector />
    </nav>
  </header>

  <button class="profile-trigger" @click="isSidebarOpen = true">
    <div class="avatar-container">
      <img v-if="user" :src="user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid" class="trigger-img" />
      <UserIcon v-else class="trigger-img" />
    </div>
    <span v-if="user" class="xp-badge">{{ userXP }} XP</span>
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
        <div v-if="userLocation" class="distance-info">
          📍 {{ formatDistance(calculateLiveDistance) }} away
        </div>
        <div class="stats">
          <div class="stat-item">🏆 50 XP</div>
          <div class="stat-item">🇦🇲 Heritage</div>
        </div>
        <div class="button-group">
        <a class="action-btn" target="_blank" :href="`https://www.google.com/maps/search/?api=1&query=${selectedPoint.lat},${selectedPoint.lng}`">
          <MapIcon class="inline-icon" /> Maps
        </a>

        <button 
          v-if="!visitedIds.includes(selectedPoint.id)" 
          @click="awardXP(50)" 
          class="checkin-btn"
        >
          Claim 50 XP
        </button>
        
        <button v-else class="checkin-btn visited" disabled>
          Visited ✅
        </button>
      </div>
      </div>
    </div>
  </Transition>

  <TheSidebar :isOpen="isSidebarOpen" :userXP="userXP" :user="user" @close="isSidebarOpen = false" />
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue"; // Add computed hereimport { MapIcon, UserIcon } from "@heroicons/vue/24/solid";
import DarkModeSelector from "./DarkModeSelector.vue";
import TheSidebar from "./TheSidebar.vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import { armenianSites } from "./locations.js";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref as dbRef, set, onValue } from "firebase/database";

const isSidebarOpen = ref(false);
const mapRef = ref(null);
const selectedPoint = ref(null);
const user = ref(null);
const userXP = ref(0);
const visitedIds = ref([]); 
const userLocation = ref(null);
let map;
let clusterGroup; // Top-level variable

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const renderMarkers = () => {
  if (!clusterGroup || !map) return;
  clusterGroup.clearLayers();

  armenianSites.forEach((site) => {
    const isVisited = visitedIds.value.includes(site.id);
    
    const marker = L.marker([site.lat, site.lng], { 
      icon: L.divIcon({
        className: `pulse-marker ${isVisited ? 'is-visited' : ''}`,
        html: `<div class="pulse-ring"></div><div class="pulse-core"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    });

    marker.on("click", () => {
      selectedPoint.value = site;
      map.flyTo([site.lat, site.lng], 15, { animate: true });
      mapRef.value.classList.add("focused");
    });

    clusterGroup.addLayer(marker);
  });
};

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      onValue(dbRef(db, 'users/' + currentUser.uid), (snapshot) => {
        const data = snapshot.val();
        if (data) {
          userXP.value = data.xp || 0;
          visitedIds.value = data.visitedIds || [];
        }
      });
    }
  });


  navigator.geolocation.watchPosition((position) => {
    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
  });

  map = L.map(mapRef.value, { attributionControl: false, zoomControl: false }).setView([40.1772, 44.5035], 8);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { 
    className: "map-tiles" 
  }).addTo(map);

  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 40,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="snap-cluster-container"><div class="snap-cluster-ring"></div><div class="snap-cluster-core"><span>${count}</span></div></div>`,
        className: 'custom-cluster',
        iconSize: L.point(40, 40)
      });
    }
  });

  map.addLayer(clusterGroup);

  watch(visitedIds, () => {
    renderMarkers();
  }, { immediate: true });

  map.on("movestart", () => mapRef.value.classList.remove("focused"));
});

const awardXP = (amount) => {
  if (!user.value) return alert("Please login first!");
  if (!selectedPoint.value) return;

  navigator.geolocation.getCurrentPosition((position) => {
    const dist = getDistance(position.coords.latitude, position.coords.longitude, selectedPoint.value.lat, selectedPoint.value.lng);

    if (dist > 500) {
      alert(`Too far! You are ${Math.round(dist)}m away. Move closer!`);
      return;
    }

    if (visitedIds.value.includes(selectedPoint.value.id)) return;

    const newVisited = [...visitedIds.value, selectedPoint.value.id];
    
    set(dbRef(db, 'users/' + user.value.uid), {
      xp: (userXP.value || 0) + amount,
      email: user.value.email,
      visitedIds: newVisited
    });
  }, () => {
    alert("Location access denied!");
  });
};

const close = () => {
  selectedPoint.value = null;
  mapRef.value.classList.remove("focused");
};

const calculateLiveDistance = computed(() => {
  if (!userLocation.value || !selectedPoint.value) return null;
  return getDistance(
    userLocation.value.lat,
    userLocation.value.lng,
    selectedPoint.value.lat,
    selectedPoint.value.lng
  );
});

// 3. Helper to make the distance look nice (m or km)
const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};
</script>

<style>
@import "./assets/style.css";
</style>
