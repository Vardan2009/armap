<template>
  <button
    @click="toggleDarkMode"
    class="transparent-btn-inline"
    style="background: transparent"
  >
    <span class="inline-icon">
      <MoonIcon class="inline-icon" v-if="isDarkMode" />
      <SunIcon class="inline-icon" v-else />
    </span>
  </button>
</template>

<script setup>
import { SunIcon, MoonIcon } from "@heroicons/vue/24/solid";

import { ref, watch, onMounted } from "vue";
const isDarkMode = ref(false);

const bodyEl = document.body;

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;

  if (isDarkMode.value) {
    bodyEl.classList.add("dark");
  } else {
    bodyEl.classList.remove("dark");
  }

  localStorage.setItem("darkMode", isDarkMode.value);
};

onMounted(() => {
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "true") {
    isDarkMode.value = true;
    bodyEl.classList.add("dark");
  }
});
</script>
