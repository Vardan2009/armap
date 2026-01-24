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
            :disabled="isLoading"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="auth-input"
            :disabled="isLoading"
          />

          <button @click="handleLogin" class="auth-btn" :disabled="isLoading">
            {{ isLoading ? "Logging in..." : "Login" }}
          </button>

          <button
            @click="handleRegister"
            class="auth-btn secondary-style"
            :disabled="isLoading"
          >
            Create Account
          </button>

          <div class="or-divider"><span>OR</span></div>

          <button
            @click="handleGoogleLogin"
            class="google-btn"
            :disabled="isLoading"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width="18"
            />
            Sign in with Google
          </button>
        </div>

        <div v-else>
          <div class="profile-header">
            <img
              :src="
                user.photoURL ||
                'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid
              "
              class="profile-avatar"
            />
            <div class="profile-info">
              <h2>
                Barev, {{ user.displayName || user.email.split("@")[0] }}!
              </h2>
              <p class="user-email">{{ user.email }}</p>
            </div>
          </div>

          <div class="divider"></div>

          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-value">🏆 {{ userXP }}</span>
              <span class="stat-label">Total XP</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">📍 {{ visitedCount }}</span>
              <span class="stat-label">Sites Visited</span>
            </div>
            <div class="stat-card full-width">
              <div class="rank-container">
                <span class="stat-label">Rank</span>
                <span class="rank-name">🇦🇲 Lvl 1 Explorer</span>
              </div>
            </div>
          </div>

          <button @click="handleLogout" class="logout-btn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                fill-rule="evenodd"
                d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"
              />
              <path
                fill-rule="evenodd"
                d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
              />
            </svg>
            Logout
          </button>
        </div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

defineProps(["isOpen"]);
const emit = defineEmits(["close"]);

const email = ref("");
const password = ref("");
const user = ref(null);
const errorMessage = ref("");
const isLoading = ref(false);

const userXP = ref(50);
const visitedCount = ref(0);

onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
  });
});

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = "Please fill in all fields.";
    return;
  }
  isLoading.value = true;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    errorMessage.value = "";
    emit("close");
  } catch (err) {
    errorMessage.value = "Login failed. Check your credentials.";
  } finally {
    isLoading.value = false;
  }
};

const handleRegister = async () => {
  if (password.value.length < 6) {
    errorMessage.value = "Password must be at least 6 characters.";
    return;
  }
  isLoading.value = true;
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    errorMessage.value = "";
    emit("close");
  } catch (err) {
    errorMessage.value = "Registration failed. This email might already exist.";
  } finally {
    isLoading.value = false;
  }
};

const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    errorMessage.value = "";
  } catch (err) {
    errorMessage.value = "Google login failed. Pop-up blocked or cancelled.";
  }
};

const handleLogout = () => signOut(auth);
</script>

<style scoped>
.side-sheet {
  position: fixed;
  top: 0;
  left: -350px;
  width: 350px;
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
  padding: 14px;
  background: #050505;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
}

.secondary-style {
  background: transparent;
  color: var(--text-color);
  border: 1px solid var(--text-color);
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

.logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 40px;
  color: #ff4d4d;
  background: none;
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
</style>
