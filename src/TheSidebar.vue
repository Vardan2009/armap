<template>
  <div>
    <div v-if="isOpen" class="sidebar-overlay" @click="emit('close')"></div>

    <div :class="['side-sheet', { 'is-open': isOpen }]">
      
      <button
      title="Close"
      class="close-drawer"
      @click="emit('close')"
    >
      <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30" 
      height="30"
      viewBox="0 0 24 24"
      class="close-icon"
      stroke="#a1a1aa" 
      fill="none"
    >
      <path d="M18 6L6 18" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
      <path d="M6 6L18 18" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
    </button>

      <div class="sheet-content">
        <div v-if="!user">
          <h2>Join ArMap</h2>
          <p>Login or create an account to save your XP!</p>
          <button @click="handleGoogleLogin" class="google-btn">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" />
              Sign in with Google
            </button>

            <div class="or-divider">OR</div>  

          <input v-model="email" type="email" placeholder="Email" class="auth-input" :disabled="isLoading" />
          <input v-model="password" type="password" placeholder="Password" class="auth-input" :disabled="isLoading" />
          
          <button @click="handleLogin" class="auth-btn" :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
          
          <button @click="handleRegister" class="secondary-btn" :disabled="isLoading">
            Sign Up
          </button>
        </div>

        <div v-else>
          <h2>Barev!</h2>
          <p class="user-email">{{ user.email }}</p>
          <div class="divider"></div>
          <div class="stats-card">
            <p>🏆 Total XP: 50</p>
          </div>
          <button @click="handleLogout" class="logout-btn">Logout</button>
        </div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { auth } from './firebase'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider, // Add this
  signInWithPopup    // Add this
} from "firebase/auth";

// PROPS & EMITS
defineProps(['isOpen']);
const emit = defineEmits(['close']); // Define once here

// STATE
const email = ref('');
const password = ref('');
const user = ref(null);
const errorMessage = ref('');
const isLoading = ref(false);

// AUTH OBSERVER
onMounted(() => {
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
  });
});

// ACTIONS
const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = "Please fill in all fields.";
    return;
  }
  isLoading.value = true;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    errorMessage.value = "";
    emit('close'); 
  } catch (err) {
    errorMessage.value = "Login failed. Check your credentials.";
  } finally {
    isLoading.value = false;
  }
};

const handleRegister = async () => {
  isLoading.value = true;
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    errorMessage.value = "";
    emit('close');
  } catch (err) {
    errorMessage.value = "Registration failed. Try a stronger password.";
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
    errorMessage.value = "Google login failed. Try again!";
  }
};

const handleLogout = () => signOut(auth);
</script>

<style scoped>
/* SIDEBAR BASE */
.side-sheet {
  position: fixed;
  top: 0;
  left: -350px;
  width: 350px;
  height: 100%;
  background: white;
  z-index: 2001;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 60px 20px; /* Increased top padding for the button space */
  box-sizing: border-box;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}
.side-sheet.is-open { left: 0; }

/* CLOSE BUTTON */
/* Position the button container */
.close-drawer {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  transition: transform 0.3s ease;
  z-index: 10;
}

/* Handle the "hover:rotate-90" effect */
.close-drawer:hover {
  transform: rotate(90deg);
}

/* Style the SVG icon (Replacing stroke-zinc-400 and group-hover:stroke-zinc-800) */
.close-icon {
  /* This forces the lines to be visible gray */
  stroke: #a1a1aa !important; 
  stroke-width: 2.5px;
  display: block;
  transition: stroke 0.3s ease;
}

.close-drawer:hover .close-icon {
  stroke: #000000 !important; /* Turn black on hover */
}

/* INPUTS & BUTTONS */
.auth-input {
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}
.auth-btn {
  width: 100%;
  padding: 12px;
  background: #050505;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 10px;
}
.auth-btn:disabled {
  background: #888;
  cursor: not-allowed;
}
.secondary-btn {
  width: 100%;
  padding: 12px;
  background: none;
  border: 1px solid #050505;
  border-radius: 8px;
  margin-top: 10px;
  cursor: pointer;
}

/* UI ELEMENTS */
.divider { height: 1px; background: #eee; margin: 20px 0; }
.user-email { color: #666; font-size: 14px; }
.error { color: #ff4d4d; font-size: 12px; margin-top: 15px; text-align: center; }
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
  backdrop-filter: blur(2px);
}
.google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: white;
  color: #757575;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 15px;
}

.google-btn:hover {
  background: #f1f1f1;
}

.or-divider {
  text-align: center;
  margin: 10px 0;
  color: #888;
  font-size: 12px;
}
</style>