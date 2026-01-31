import { ref } from "vue";
import { supabase } from "./supabase";

let authInitialized = false;

const user = ref(null);
const error = ref(null);
const loading = ref(false);

export function useAuth() {
  if (!authInitialized) {
    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user ?? null;
    });
    authInitialized = true;
  }

  const signupWithEmail = async (email, password) => {
    error.value = null;
    loading.value = true;
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
    });
    error.value = err;
    loading.value = false;
    return data;
  };

  const loginWithEmail = async (email, password) => {
    error.value = null;

    loading.value = true;
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    error.value = err;
    loading.value = false;
    return data;
  };

  const loginWithGoogle = async () => {
    error.value = null;
    loading.value = true;

    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    error.value = err;
    loading.value = false;
    return data;
  };

  const logout = async () => {
    error.value = null;
    loading.value = true;
    const { error: err } = await supabase.auth.signOut();
    if (err) error.value = err;
    user.value = null;
    error.value = err;
    loading.value = false;
  };

  return {
    user,
    error,
    loading,
    signupWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
  };
}
