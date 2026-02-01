<template>
  <div>
    <div v-if="isOpen" class="sidebar-overlay" @click="emit('close')"></div>

    <div :class="['side-sheet', { 'is-open': isOpen }]">
      <button title="Close" class="close-drawer" @click="emit('close')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          class="close-icon"
          fill="none"
        >
          <path
            d="M18 6L6 18"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
          <path
            d="M6 6L18 18"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
      </button>

      <div class="sheet-content">
        <div v-if="!user">
          <div class="header-section">
            <h2>Join ArMap</h2>
            <p>Login to save your heritage discoveries and earn XP.</p>
          </div>
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="auth-input"
            :disabled="loading"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="auth-input"
            :disabled="loading"
          />
          <button
            @click="handleLogin"
            class="action-btn auth-btn"
            :disabled="loading"
          >
            Login
          </button>
          <button
            @click="handleRegister"
            class="action-btn secondary-style auth-btn"
            :disabled="loading"
          >
            Create Account
          </button>
          <div class="or-divider"><span>OR</span></div>
          <button
            @click="handleGoogleLogin"
            class="google-btn"
            :disabled="loading"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width="18"
            />
            Sign in with Google
          </button>
        </div>

        <div v-else-if="userData">
          <div class="profile-header">
            <img
              :src="
                user.user_metadata.picture ||
                'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid
              "
              class="profile-avatar"
            />
            <div class="profile-info">
              <h2>
                Barev,
                {{ user.user_metadata.name || user.email.split("@")[0] }}!
              </h2>
              <p class="user-email">{{ user.email }}</p>
            </div>
          </div>

          <button
            @click="handleLogout"
            class="action-btn logout-btn"
            :disabled="loading"
          >
            <KeyIcon class="inline-icon" />
            {{ loading ? "Logging out..." : "Log out" }}
          </button>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">🏆 {{ userData.xp }}</span>
              <span class="stat-label">Total XP</span>
            </div>
            <div class="stat-card">
              <span class="stat-value"
                >📍 {{ userData.visitedids.length }}</span
              >
              <span class="stat-label">Visited</span>
            </div>
          </div>

          <div class="leaderboard-section">
            <h3 class="section-title">Global Leaderboard</h3>
            <div class="leaderboard-list">
              <div
                v-for="(player, index) in topTen"
                :key="player.uid"
                :class="[
                  'leader-item',
                  {
                    'is-me': player.uid === user.id,
                    'is-first': index == 0,
                    'is-second': index == 1,
                    'is-third': index == 2,
                  },
                ]"
              >
                <span class="rank">#{{ index + 1 }}</span>
                <span class="name">{{ player.name }}</span>
                <span class="xp">{{ player.xp }} XP</span>
              </div>

              <template v-if="userRank > 10">
                <div class="leader-divider">•••</div>
                <div class="leader-item is-me">
                  <span class="rank">#{{ userRank }}</span>
                  <span class="name">{{
                    user.user_metadata.name || user.email.split("@")[0]
                  }}</span>
                  <span class="xp">{{ userData.xp }} XP</span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <div v-else class="no-user-section">
          <p>Loading user data...</p>
        </div>

        <p v-if="error" class="error">{{ error.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { KeyIcon } from "@heroicons/vue/24/solid";

import { useAuth } from "./useAuth";
import { useDB } from "./useDB";

const {
  user,
  error,
  loading,
  signupWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout,
} = useAuth();

const { userData, getGlobalLeaderboard } = useDB();

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close"]);

const email = ref("");
const password = ref("");

const globalLeaderboard = ref(null);

const topTen = computed(() => {
  if (!globalLeaderboard.value) return [];
  return globalLeaderboard.value.slice(0, 10);
});

const userRank = computed(() => {
  if (!globalLeaderboard.value) return 0;
  return globalLeaderboard.value.findIndex((el) => el.uid == user.id) + 1;
});

onMounted(async () => {
  globalLeaderboard.value = await getGlobalLeaderboard();
});

const handleLogin = async () => {
  if (!email.value || !password.value) {
    return;
  }
  await loginWithEmail(email.value, password.value);
};

const handleRegister = async () => {
  await signupWithEmail(email.value, password.value);
};

const handleGoogleLogin = async () => {
  await loginWithGoogle();
};

const handleLogout = () => {
  logout();
};
</script>

<style scoped>
.side-sheet {
  position: fixed;
  top: 0;
  left: -450px;
  width: 450px;
  height: 100%;
  background: var(--background-color);
  color: var(--text-color);
  z-index: 2002;
  transition: left 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 60px 24px;
  box-sizing: border-box;
  box-shadow: 5px 0 25px rgba(0, 0, 0, 0.15);
}
.side-sheet.is-open {
  left: 0;
}

@media screen and (max-width: 500px) {
  .side-sheet.is-open {
    width: 100% !important;
  }
}

.header-section {
  margin-bottom: 30px;
}
.header-section h2 {
  color: var(--text-color);
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: bold;
}
.header-section p {
  font-size: 14px;
  line-height: 1.5;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 5px;
}

.profile-info h2 {
  font-size: 20px;
  margin: 0;
}
.user-email {
  opacity: 0.5;
  font-size: 12px;
  margin: 2px 0 0 0;
}

.divider {
  height: 1px;
  background: var(--text-color);
  opacity: 0.1;
  margin: 20px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 20px 0;
}
.stat-card {
  background: var(--background-color-lighter);
  padding: 15px;
  border-radius: 5px;
  text-align: center;
}
.stat-card.full-width {
  grid-column: span 2;
  text-align: left;
}
.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
}
.stat-label {
  font-size: 11px;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.rank-name {
  color: var(--text-color);
  font-weight: 600;
  display: block;
  margin-top: 4px;
}

.close-drawer {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.3s ease;
}
.close-drawer:hover {
  transform: rotate(90deg);
}
.close-icon {
  stroke: #a1a1aa;
}
.close-drawer:hover .close-icon {
  stroke: var(--text-color);
}

.auth-btn {
  width: 100%;
  padding: 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
}

.secondary-style {
  background: var(--background-color-lighter);
  color: var(--text-color);
}

.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: white;
  color: #3c4043;
  border: 1px solid #dadce0;
  border-radius: 5px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 10px;
}

.google-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.logout-btn {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  background: var(--red-color);
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.or-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: #ccc;
}
.or-divider::before,
.or-divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #eee;
}
.or-divider span {
  padding: 0 10px;
  font-size: 12px;
}

.auth-input {
  width: 100%;
  padding: 12px;
  margin-bottom: 12px;
  border: none;
  border-radius: 5px;
  background: var(--background-color-lighter);
  box-sizing: border-box;
  color: var(--text-color);
  outline: none;
}

.error {
  color: #ff4d4d;
  font-size: 12px;
  margin-top: 15px;
  text-align: center;
}
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  backdrop-filter: blur(4px);
}

/* --- Leaderboard Styles --- */
.leaderboard-section {
  margin-top: 25px;
  background: #f9f9f9;
  border-radius: 5px;
  padding: 16px;
  border: 1px solid #f0f0f0;
}

.section-title {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888;
  margin-bottom: 12px;
  font-weight: 700;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leader-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 5px;
  font-size: 14px;
  border: 1px solid transparent;
}

.leader-item .rank {
  color: var(--primary-color);
}

.leader-item.is-me {
  border-color: var(--primary-color);
  background: rgba(53, 108, 184, 0.05);
}

.leader-item.is-first {
  --primary-color: #e09834;
}

.leader-item.is-second {
  --primary-color: #696e70;
}

.leader-item.is-third {
  --primary-color: #854120;
}

.leader-item.is-me .name::after {
  content: "(You)";
  font-size: 12px;
  color: var(--primary-color);
  margin-left: 4px;
}

.rank {
  font-weight: 800;
  width: 30px;
  color: #a1a1aa;
}

.leader-item.is-me .rank {
  color: var(--primary-color);
}

.name {
  flex: 1;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
}

.xp {
  font-weight: 800;
  color: var(--text-color);
  font-size: 12px;
}

.leader-divider {
  text-align: center;
  color: #ccc;
  font-size: 12px;
  margin: 4px 0;
}

body.dark .leaderboard-section {
  background: #2c2c2e;
  border-color: #3a3a3c;
}

body.dark .leader-item {
  background: #1c1c1e;
  color: white;
}
</style>
