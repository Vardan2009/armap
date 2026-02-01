import { ref } from "vue";
import { supabase } from "./supabase";

let dbInitialized = false;

const userData = ref(null);
const loading = ref(false);
const error = ref(null);

export function useDB() {
  if (!dbInitialized) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        userData.value = null;
      } else {
        fetchUserData();
      }
    });
    dbInitialized = true;
  }

  const fetchUserData = async () => {
    loading.value = true;

    const {
      data: { user },
      error: err,
    } = await supabase.auth.getUser();

    if (!user || err) return null;

    const { data, error: err2 } = await supabase
      .from("userData")
      .select("*")
      .eq("uid", user.id)
      .single();

    userData.value = data;
    error.value = err2;
    loading.value = false;
    return data;
  };

  const visitLocation = async (locationId, userLat, userLng) => {
    const {
      data: { user },
      error: err1,
    } = await supabase.auth.getUser();

    if (!user || err1) {
      error.value = { message: "Not authenticated" };
      return null;
    }

    loading.value = true;
    const { data, error: err } = await supabase.rpc("visit_location", {
      givenuid: user.id,
      loc_id: locationId,
      user_lat: userLat,
      user_lng: userLng,
    });

    error.value = err;
    loading.value = false;

    fetchUserData();
    return data;
  };

  const getGlobalLeaderboard = async () => {
    loading.value = true;

    const { data, error: err } = await supabase.rpc("get_global_leaderboard");
    error.value = err;
    if (error.value) {
      alert("Error:", error.value.message);
    }
    loading.value = false;
    return data;
  };

  getGlobalLeaderboard();

  return {
    userData,
    loading,
    error,
    fetchUserData,
    visitLocation,
    getGlobalLeaderboard,
  };
}
