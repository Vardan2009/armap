<template>
  <header>
    <h1 class="logo">ArMap</h1>
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
      />
      <UserIcon v-else class="trigger-img" />
    </div>
    <span v-if="user" class="xp-badge">{{ userData?.xp ?? "No" }} XP</span>
  </button>

  <button
    v-if="userLocation"
    class="move-view-to-location"
    @click="moveViewToLocation"
  >
    📍 Where am I?
  </button>

  <div ref="mapRef" class="map"></div>

  <Transition name="slide-up">
    <div v-if="selectedPoint" class="story-card">
      <button @click="close" class="close-btn">✕</button>
      <div class="card-image-container">
        <img :src="selectedPoint.imageURL" class="location-image" />
        <div class="image-gradient"></div>
      </div>
      <div class="card-content">
        <span class="category">{{ selectedPoint.category }}</span>
        <h2>{{ selectedPoint.name }}</h2>
        <p>{{ selectedPoint.description }}</p>
        <div class="stats">
          <div class="stat-item">🏆 {{ selectedPoint.xpAmount }} XP</div>
          <div class="stat-item">
            📍 {{ formatDistance(calculateLiveDistance) }} away
          </div>
        </div>
        <div class="button-group">
          <a
            class="action-btn"
            target="_blank"
            :href="`https://www.google.com/maps/search/?api=1&query=${selectedPoint.lat},${selectedPoint.lng}`"
          >
            <MapIcon class="inline-icon" /> Maps
          </a>

          <button
            v-if="!userData.visitedids.includes(selectedPoint.id)"
            @click="awardXP(selectedPoint)"
            class="checkin-btn"
            :disabled="
              userLocation === null || xpLoading || calculateLiveDistance > 500
            "
          >
            <template v-if="userLocation === null || xpLoading">
              Please wait...
            </template>
            <template v-else-if="calculateLiveDistance > 500">
              Too far away
            </template>
            <template v-else> Claim {{ selectedPoint.xpAmount }} XP </template>
          </button>

          <button v-else class="checkin-btn visited" disabled>
            Visited ✅
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <TheSidebar @close="isSidebarOpen = false" :isOpen="isSidebarOpen" />
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { MapIcon, UserIcon } from "@heroicons/vue/24/solid";
import DarkModeSelector from "./DarkModeSelector.vue";
import TheSidebar from "./TheSidebar.vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";

import { useAuth } from "./useAuth";
import { useDB } from "./useDB";
import { supabase } from "./supabase";

const { user } = useAuth();
const { userData, visitLocation, error: dbError, fetchUserData } = useDB();

const isSidebarOpen = ref(false);
const mapRef = ref(null);
const selectedPoint = ref(null);
const userLocation = ref(null);
let map;
let clusterGroup; // Top-level variable

let userMarker = L.circleMarker([0, 0], {
  radius: 3,
  className: "user-marker",
});

const xpLoading = ref(false);

const armenianSites = ref([]);

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const updateMapData = async () => {
  await fetchUserData();
  armenianSites.value = supabase
    .from("locations")
    .select("*")
    .then(({ data }) => {
      armenianSites.value = data;
      renderMarkers();
    });
};

const renderMarkers = () => {
  if (!clusterGroup || !map) return;
  clusterGroup.clearLayers();

  armenianSites.value.forEach((site) => {
    const isVisited = userData.value?.visitedids?.includes(site.id) || false;

    const marker = L.marker([site.lat, site.lng], {
      icon: L.divIcon({
        className: `pulse-marker ${isVisited ? "is-visited" : ""}`,
        html: `<div class="pulse-ring"></div><div class="pulse-core"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    });

    marker.on("click", () => {
      if (xpLoading.value) return;
      selectedPoint.value = site;
      map.flyTo([site.lat, site.lng], 15, { animate: true });
      mapRef.value.classList.add("focused");
    });

    clusterGroup.addLayer(marker);
  });
};

onMounted(() => {
  updateMapData();

  navigator.geolocation.watchPosition((position) => {
    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  });

  map = L.map(mapRef.value, {
    attributionControl: false,
    zoomControl: false,
    maxBounds: [
      [38.7696, 43.4196],
      [41.3011, 46.6282],
    ],
    maxBoundsViscosity: 1,
    zoomSnap: 0.5,
    minZoom: 10,
  }).setView([40.1772, 44.5035], 8);

  userMarker.addTo(map);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      className: "map-tiles",
    }
  ).addTo(map);

  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 40,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();

      return L.divIcon({
        html: `<div class="snap-cluster-container"><div class="snap-cluster-ring"></div><div class="snap-cluster-core"><span>${count}</span></div></div>`,
        className: "custom-cluster",
        iconSize: L.point(40, 40),
      });
    },
  });

  map.addLayer(clusterGroup);

  watch(
    userLocation,
    (newLocation) => {
      if (!newLocation) return;

      userMarker.setLatLng([newLocation.lat, newLocation.lng]);
    },
    { immediate: true }
  );

  map.on("movestart", () => mapRef.value.classList.remove("focused"));
});

const moveViewToLocation = () => {
  if (!userLocation.value || !map) return;
  if (xpLoading.value) return;
  map.flyTo([userLocation.value.lat, userLocation.value.lng], 15, {
    animate: true,
  });
  mapRef.value.classList.add("focused");
};

const awardXP = (selectedPoint) => {
  if (xpLoading.value) return;
  xpLoading.value = true;

  if (!user.value) {
    xpLoading.value = false;
    return alert("Please login first!");
  }

  if (!selectedPoint) {
    xpLoading.value = false;
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const dist = getDistance(
        position.coords.latitude,
        position.coords.longitude,
        selectedPoint.lat,
        selectedPoint.lng
      );

      if (dist > 500) {
        alert(`Too far! You are ${Math.round(dist)}m away. Move closer!`);
        xpLoading.value = false;

        return;
      }

      visitLocation(
        selectedPoint.id,
        position.coords.latitude,
        position.coords.longitude
      ).then(() => {
        if (dbError.value) {
          alert(`Error: ${dbError.value.message}`);
          xpLoading.value = false;
          return;
        }
        xpLoading.value = false;
        updateMapData();
      });
    },
    () => {
      alert("Location access denied!");
      xpLoading.value = false;
    }
  );
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
