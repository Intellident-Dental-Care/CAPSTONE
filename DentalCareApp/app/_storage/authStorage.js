import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../server/supabaseService"; // Adjust path if needed

/* =========================
   STORAGE KEYS
========================= */
const ACCOUNTS_KEY = "@dc_accounts";
const SESSION_KEY = "@auth_session";
const PROFILES_KEY = "@dc_profiles_by_email";
const ACTIVE_PROFILE_KEY = "@dc_active_profile_by_email";
const PATIENT_PROFILES_KEY = "@dc_patient_profiles";

/* =========================
   SESSION & AUTH FUNCTIONS
========================= */

// Unified session storage function for both regular login and Google login
export const storeSession = async ({ user, session, fullName }) => {
  try {
    const sessionData = {
      user,
      session: session || null,
      fullName: fullName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User',
      loginTime: Date.now()
    };
    
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    console.log(" Session stored successfully");
  } catch (error) {
    console.error("Error storing session:", error);
  }
};

// Keep setSession for Google login compatibility
export const setSession = async (sessionData) => {
  try {
    const unifiedData = {
      user: sessionData.user,
      session: sessionData.session || null,
      fullName: sessionData.fullName,
      loginTime: sessionData.loginTime || Date.now()
    };
    
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(unifiedData));
    console.log("✅ Google session stored successfully");
  } catch (error) {
    console.error("Error setting session:", error);
  }
};

export const getSession = async () => {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    // Sign out from Supabase (From File 1)
    if (supabase?.auth) {
      await supabase.auth.signOut();
    }
    
    // Clear AsyncStorage session
    await AsyncStorage.removeItem(SESSION_KEY);
    await AsyncStorage.removeItem(PROFILES_KEY);
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
    await AsyncStorage.removeItem(PATIENT_PROFILES_KEY);
    console.log("✅ User logged out successfully");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

/* =========================
   ACCOUNT FUNCTIONS
========================= */

export const getAccounts = async () => {
  try {
    const data = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log("getAccounts error:", error);
    return [];
  }
};

export const saveAccounts = async (accounts) => {
  try {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.log("saveAccounts error:", error);
  }
};

export const createUser = async (userData) => {
  try {
    const accounts = await getAccounts();

    const cleanEmail = (userData?.email || "").trim().toLowerCase();
    const cleanFullName = (userData?.fullName || "").trim();
    const cleanPassword = (userData?.password || "").trim();

    if (!cleanFullName || !cleanEmail || !cleanPassword) {
      return { success: false, message: "Please fill in all fields." };
    }

    const emailExists = accounts.some(
      (acc) => ((acc?.email || "").trim().toLowerCase() === cleanEmail)
    );

    if (emailExists) {
      return { success: false, message: "Email already exists." };
    }

    const newUser = {
      id: Date.now().toString(),
      fullName: cleanFullName,
      email: cleanEmail,
      password: cleanPassword,
      onboardingSeen: false,
      needsPatientSetup: true,
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = [...accounts, newUser];
    await saveAccounts(updatedAccounts);

    return { success: true, user: newUser };
  } catch (error) {
    console.log("createUser error:", error);
    return { success: false, message: "Failed to create user." };
  }
};

export const loginUser = async (email, password) => {
  try {
    const accounts = await getAccounts();

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    const matchedUser = accounts.find(
      (acc) =>
        ((acc?.email || "").trim().toLowerCase() === cleanEmail) &&
        (acc?.password || "") === cleanPassword
    );

    if (!matchedUser) {
      return { success: false, message: "Invalid email or password." };
    }

    // Adapt local user to unified session format
    await storeSession({ user: matchedUser, session: null, fullName: matchedUser.fullName });

    return { success: true, user: matchedUser };
  } catch (error) {
    console.log("loginUser error:", error);
    return { success: false, message: "Login failed." };
  }
};

export const updateUser = async (updatedUser) => {
  try {
    const accounts = await getAccounts();

    const updatedAccounts = accounts.map((acc) =>
      acc.id === updatedUser.id ? { ...acc, ...updatedUser } : acc
    );

    await saveAccounts(updatedAccounts);
    await storeSession({ user: updatedUser, session: null, fullName: updatedUser.fullName });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.log("updateUser error:", error);
    return { success: false, message: "Failed to update user." };
  }
};

export const deleteUser = async (email) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const accounts = await getAccounts();

    const filteredAccounts = accounts.filter(
      (acc) => ((acc?.email || "").trim().toLowerCase() !== cleanEmail)
    );

    await saveAccounts(filteredAccounts);

    // Clean up profiles
    const rawProfiles = await AsyncStorage.getItem(PROFILES_KEY);
    const parsedProfiles = rawProfiles ? JSON.parse(rawProfiles) : {};
    const deletedProfiles = parsedProfiles[cleanEmail] || [];
    delete parsedProfiles[cleanEmail];
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(parsedProfiles));

    // Clean up active profile
    const rawActive = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    const parsedActive = rawActive ? JSON.parse(rawActive) : {};
    delete parsedActive[cleanEmail];
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(parsedActive));

    // Clean up patient profiles
    const rawPatientProfiles = await AsyncStorage.getItem(PATIENT_PROFILES_KEY);
    const parsedPatientProfiles = rawPatientProfiles ? JSON.parse(rawPatientProfiles) : {};

    deletedProfiles.forEach((profile) => {
      delete parsedPatientProfiles[profile.id];
    });

    await AsyncStorage.setItem(PATIENT_PROFILES_KEY, JSON.stringify(parsedPatientProfiles));

    // Logout if current session is the deleted user
    const sessionData = await getSession();
    if (((sessionData?.user?.email || "").trim().toLowerCase()) === cleanEmail) {
      await logoutUser();
    } else {
      // Keep local email-keyed caches from reviving deleted profiles for reused emails.
      await AsyncStorage.removeItem(PROFILES_KEY);
      await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
      await AsyncStorage.removeItem(PATIENT_PROFILES_KEY);
    }

    return { success: true };
  } catch (error) {
    console.log("deleteUser error:", error);
    return { success: false, message: "Failed to delete user." };
  }
};

/* =========================
   PROFILE FUNCTIONS
========================= */

export const getProfilesByEmail = async (email) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return [];

    // Return local cache immediately when populated
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const local = parsed[cleanEmail] || [];
    if (local.length > 0) return local;

    // Local is empty — try bootstrapping from Supabase (e.g. fresh install / new device)
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", supabaseUser.id)
          .order("created_at", { ascending: true });
        if (data?.length) {
          const supaProfiles = data.map((p) => ({
            id: p.id,
            name: p.name,
            icon: p.icon || "person",
            email: p.email || cleanEmail,
            needsPatientSetup: p.needs_patient_setup,
            avatarUrl: p.avatar_url || p.avatarUrl || "",
          }));
          parsed[cleanEmail] = supaProfiles;
          await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(parsed));
          return supaProfiles;
        }
      }
    } catch (_) {}

    return [];
  } catch (error) {
    console.log("getProfilesByEmail error:", error);
    return [];
  }
};

export const saveProfilesByEmail = async (email, profiles) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return;

    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    parsed[cleanEmail] = profiles;
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.log("saveProfilesByEmail error:", error);
  }
};

export const addProfileToEmail = async (email, profileName) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanProfileName = (profileName || "").trim();

    if (!cleanEmail || !cleanProfileName) {
      return { success: false, message: "Profile name is required." };
    }

    const profiles = await getProfilesByEmail(cleanEmail);

    const nameExists = profiles.some(
      (profile) => ((profile?.name || "").trim().toLowerCase() === cleanProfileName.toLowerCase())
    );

    if (nameExists) {
      return { success: false, message: "Profile name already exists." };
    }

    // Use a local fallback ID; replaced by the Supabase UUID when available
    let profileId = Date.now().toString();

    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) {
        const { data, error } = await supabase
          .from("user_profiles")
          .insert({
            user_id: supabaseUser.id,
            name: cleanProfileName,
            email: cleanEmail,
            icon: "person",
            needs_patient_setup: true,
          })
          .select("id")
          .single();
        if (!error && data?.id) profileId = data.id;
      }
    } catch (_) {}

    const newProfile = {
      id: profileId,
      name: cleanProfileName,
      icon: "person",
      email: cleanEmail,
      needsPatientSetup: true,
    };

    const updatedProfiles = [...profiles, newProfile];
    await saveProfilesByEmail(cleanEmail, updatedProfiles);

    return { success: true, profile: newProfile, profiles: updatedProfiles };
  } catch (error) {
    console.log("addProfileToEmail error:", error);
    return { success: false, message: "Failed to add profile." };
  }
};

export const getActiveProfileByEmail = async (email) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return null;

    const raw = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed[cleanEmail] || null;
  } catch (error) {
    console.log("getActiveProfileByEmail error:", error);
    return null;
  }
};

export const setActiveProfileByEmail = async (email, profile) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !profile) return;

    const raw = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    parsed[cleanEmail] = profile;
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.log("setActiveProfileByEmail error:", error);
  }
};

export const ensureDefaultProfileForEmail = async (email, fallbackName = "User") => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return { profiles: [], activeProfile: null };
    }

    let profiles = await getProfilesByEmail(cleanEmail);

    if (profiles.length === 0) {
      let profileId = Date.now().toString();

      // Create the default profile row in Supabase when a Supabase session exists
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser?.id) {
          const { data, error } = await supabase
            .from("user_profiles")
            .insert({
              user_id: supabaseUser.id,
              name: fallbackName,
              email: cleanEmail,
              icon: "person",
              needs_patient_setup: true,
              is_active: true,
            })
            .select("id")
            .single();
          if (!error && data?.id) profileId = data.id;
        }
      } catch (_) {}

      const defaultProfile = {
        id: profileId,
        name: fallbackName,
        icon: "person",
        email: cleanEmail,
        needsPatientSetup: true,
      };

      profiles = [defaultProfile];
      await saveProfilesByEmail(cleanEmail, profiles);
      await setActiveProfileByEmail(cleanEmail, defaultProfile);

      return { profiles, activeProfile: defaultProfile };
    }

    let activeProfile = await getActiveProfileByEmail(cleanEmail);
    const stillExists = profiles.find((p) => p.id === activeProfile?.id);

    if (!activeProfile || !stillExists) {
      activeProfile = profiles[0];
      await setActiveProfileByEmail(cleanEmail, activeProfile);
    }

    return { profiles, activeProfile };
  } catch (error) {
    console.log("ensureDefaultProfileForEmail error:", error);
    return { profiles: [], activeProfile: null };
  }
};

export const updateProfileInAccount = async (email, updatedProfile) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !updatedProfile?.id) {
      return { success: false, message: "Invalid profile." };
    }

    const profiles = await getProfilesByEmail(cleanEmail);

    const updatedProfiles = profiles.map((profile) =>
      profile.id === updatedProfile.id ? { ...profile, ...updatedProfile } : profile
    );

    await saveProfilesByEmail(cleanEmail, updatedProfiles);

    const activeProfile = await getActiveProfileByEmail(cleanEmail);
    if (activeProfile?.id === updatedProfile.id) {
      await setActiveProfileByEmail(cleanEmail, {
        ...activeProfile,
        ...updatedProfile,
      });
    }

    return { success: true, profiles: updatedProfiles };
  } catch (error) {
    console.log("updateProfileInAccount error:", error);
    return { success: false, message: "Failed to update profile." };
  }
};

export const getCurrentActiveProfileForSession = async () => {
  try {
    const sessionData = await getSession();
    const cleanEmail = (sessionData?.user?.email || "").trim().toLowerCase();
    if (!cleanEmail) return null;

    const setup = await ensureDefaultProfileForEmail(
      cleanEmail,
      sessionData?.fullName || "User"
    );

    return setup?.activeProfile || (await getActiveProfileByEmail(cleanEmail));
  } catch (error) {
    console.log("getCurrentActiveProfileForSession error:", error);
    return null;
  }
};

/* =========================
   PATIENT PROFILE FUNCTIONS
========================= */

export const getPatientProfiles = async () => {
  try {
    const raw = await AsyncStorage.getItem(PATIENT_PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    console.log("getPatientProfiles error:", error);
    return {};
  }
};

export const savePatientProfileByProfileId = async (profileId, payload) => {
  try {
    const cleanProfileId = (profileId || "").trim();
    if (!cleanProfileId) {
      return { success: false, message: "Profile id is required." };
    }

    const existingProfiles = await getPatientProfiles();

    existingProfiles[cleanProfileId] = {
      ...(existingProfiles[cleanProfileId] || {}),
      ...payload,
      profileId: cleanProfileId,
    };

    await AsyncStorage.setItem(PATIENT_PROFILES_KEY, JSON.stringify(existingProfiles));

    // Sync patient details to Supabase user_profiles row
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) {
        const syncPayload = {
          full_name: payload.fullName || null,
          dob: payload.dob || null,
          age: payload.age || null,
          mobile: payload.mobile || null,
          email: payload.email || null,
          medical_history: payload.medicalHistory || {},
          needs_patient_setup: false,
        };

        if (payload.avatarUrl !== undefined) {
          syncPayload.avatar_url = payload.avatarUrl || null;
        }

        await supabase
          .from("user_profiles")
          .update(syncPayload)
          .eq("id", cleanProfileId)
          .eq("user_id", supabaseUser.id);
      }
    } catch (_) {}

    return { success: true, profile: existingProfiles[cleanProfileId] };
  } catch (error) {
    console.log("savePatientProfileByProfileId error:", error);
    return { success: false, message: "Failed to save patient profile." };
  }
};

export const getPatientProfileByProfileId = async (profileId) => {
  try {
    const cleanProfileId = (profileId || "").trim();
    if (!cleanProfileId) return null;

    // Return local cache immediately when populated
    const profiles = await getPatientProfiles();
    const local = profiles[cleanProfileId] || null;
    if (local) return local;

    // Cache miss — fetch from Supabase (e.g. fresh install / switched device)
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", cleanProfileId)
          .eq("user_id", supabaseUser.id)
          .single();
        if (data) {
          const mapped = {
            profileId: data.id,
            fullName: data.full_name || "",
            dob: data.dob || "",
            age: data.age || "",
            mobile: data.mobile || "",
            email: data.email || "",
            medicalHistory: data.medical_history || {},
            avatarUrl: data.avatar_url || data.avatarUrl || "",
          };
          // Write back to local cache
          profiles[cleanProfileId] = mapped;
          await AsyncStorage.setItem(PATIENT_PROFILES_KEY, JSON.stringify(profiles));
          return mapped;
        }
      }
    } catch (_) {}

    return null;
  } catch (error) {
    console.log("getPatientProfileByProfileId error:", error);
    return null;
  }
};

export const updatePatientProfileByProfileId = async (profileId, updates) => {
  try {
    const cleanProfileId = (profileId || "").trim();
    if (!cleanProfileId) {
      return { success: false, message: "Profile id is required." };
    }

    const profiles = await getPatientProfiles();
    const existing = profiles[cleanProfileId] || {};

    profiles[cleanProfileId] = {
      ...existing,
      ...updates,
      profileId: cleanProfileId,
    };

    await AsyncStorage.setItem(PATIENT_PROFILES_KEY, JSON.stringify(profiles));

    // Sync updated patient details to Supabase
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) {
        const syncPayload = {
          full_name: updates.fullName || null,
          dob: updates.dob || null,
          age: updates.age || null,
          mobile: updates.mobile || null,
          email: updates.email || null,
          medical_history: updates.medicalHistory || existing.medicalHistory || {},
        };

        if (updates.avatarUrl !== undefined) {
          syncPayload.avatar_url = updates.avatarUrl || null;
        }

        await supabase
          .from("user_profiles")
          .update(syncPayload)
          .eq("id", cleanProfileId)
          .eq("user_id", supabaseUser.id);
      }
    } catch (_) {}

    return { success: true, profile: profiles[cleanProfileId] };
  } catch (error) {
    console.log("updatePatientProfileByProfileId error:", error);
    return { success: false, message: "Failed to update patient profile." };
  }
};

export const setPatientSetupDoneForProfile = async (email, profileId) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanProfileId = (profileId || "").trim();

    if (!cleanEmail || !cleanProfileId) return;

    const profiles = await getProfilesByEmail(cleanEmail);
    const updatedProfiles = profiles.map((profile) =>
      profile.id === cleanProfileId ? { ...profile, needsPatientSetup: false } : profile
    );

    await saveProfilesByEmail(cleanEmail, updatedProfiles);

    const activeProfile = await getActiveProfileByEmail(cleanEmail);
    if (activeProfile?.id === cleanProfileId) {
      await setActiveProfileByEmail(cleanEmail, {
        ...activeProfile,
        needsPatientSetup: false,
      });
    }

    // Mark setup done in Supabase
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser?.id) {
        await supabase
          .from("user_profiles")
          .update({ needs_patient_setup: false })
          .eq("id", cleanProfileId)
          .eq("user_id", supabaseUser.id);
      }
    } catch (_) {}
  } catch (error) {
    console.log("setPatientSetupDoneForProfile error:", error);
  }
};

export const setPatientSetupDoneForUser = async (email) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return;

    const accounts = await getAccounts();

    const updatedAccounts = accounts.map((acc) =>
      ((acc?.email || "").trim().toLowerCase() === cleanEmail)
        ? { ...acc, needsPatientSetup: false }
        : acc
    );

    await saveAccounts(updatedAccounts);
  } catch (error) {
    console.log("setPatientSetupDoneForUser error:", error);
  }
};

/* =========================
   MEDICAL HISTORY FUNCTIONS (Supabase)
========================= */

// Helper function to validate UUID format
const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const saveMedicalHistoryToSupabase = async (payload) => {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId || !isValidUUID(userId)) {
      return { success: false, message: "User not authenticated" };
    }

    let { profileId, fullName, dob, mobile, email, medicalHistory } = payload;

    // Validate profileId - if not a valid UUID, treat as null (main account only)
    if (profileId && !isValidUUID(profileId)) {
      console.warn(`Invalid profileId format: ${profileId}. Saving as main account only.`);
      profileId = null;
    }

    // Prepare the data to insert/update
    const medicalData = {
      user_id: userId,
      profile_id: profileId || null,
      full_name: fullName,
      dob: dob,
      mobile: mobile,
      email: email,
      blood_type: medicalHistory?.bloodType || null,
      medical_history: medicalHistory || {},
    };

    // Check if record already exists with proper user_id and profile_id validation
    let query = supabase
      .from("patient_medical_profiles")
      .select("id, user_id, profile_id");

    if (profileId) {
      // For profile-based accounts: match both user_id AND profile_id
      query = query.eq("user_id", userId).eq("profile_id", profileId);
    } else {
      // For main account: match user_id and ensure profile_id is null
      query = query.eq("user_id", userId).is("profile_id", null);
    }

    const { data: existingRecords, error: selectError } = await query;

    if (selectError) {
      console.error("Error checking existing record:", selectError);
      return { success: false, message: "Failed to check existing record" };
    }

    let result;

    if (existingRecords && existingRecords.length > 0) {
      // Update existing record - validate ownership before updating
      const existingRecord = existingRecords[0];
      
      // Safety check: Ensure we're not updating someone else's record
      const isOwner = existingRecord.user_id === userId && 
                      (profileId ? existingRecord.profile_id === profileId : existingRecord.profile_id === null);
      
      if (!isOwner) {
        console.error("Unauthorized: Attempting to update record owned by another user");
        return { success: false, message: "Unauthorized access to medical record" };
      }

      // Warn if multiple records exist (should never happen with proper constraints)
      if (existingRecords.length > 1) {
        console.warn(`Warning: Found ${existingRecords.length} medical records for user. Updating first record only.`);
      }

      const recordId = existingRecord.id;
      result = await supabase
        .from("patient_medical_profiles")
        .update(medicalData)
        .eq("id", recordId)
        .eq("user_id", userId); // Double-check user_id in update query
    } else {
      // No existing record - create a new one
      result = await supabase
        .from("patient_medical_profiles")
        .insert([medicalData]);
    }

    if (result.error) {
      console.error("Error saving medical history:", result.error);
      return { success: false, message: result.error.message };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error("saveMedicalHistoryToSupabase error:", error);
    return { success: false, message: error.message };
  }
};

export const getMedicalHistoryFromSupabase = async (profileId) => {
  try {
    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, message: "User not authenticated", data: null };
    }

    let query = supabase
      .from("patient_medical_profiles")
      .select("*");

    if (profileId) {
      query = query.eq("profile_id", profileId).eq("user_id", userId);
    } else {
      query = query.eq("user_id", userId).is("profile_id", null);
    }

    const { data, error } = await query.single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (not an error in this case)
      console.error("Error fetching medical history:", error);
      return { success: false, message: error.message, data: null };
    }

    return { success: true, data: data || null };
  } catch (error) {
    console.error("getMedicalHistoryFromSupabase error:", error);
    return { success: false, message: error.message, data: null };
  }
};

/* =========================
   ONBOARDING FUNCTIONS
========================= */

export const setOnboardingSeenForUser = async (email) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return;

    const accounts = await getAccounts();

    const updatedAccounts = accounts.map((acc) =>
      ((acc?.email || "").trim().toLowerCase() === cleanEmail)
        ? { ...acc, onboardingSeen: true }
        : acc
    );

    await saveAccounts(updatedAccounts);
  } catch (error) {
    console.log("setOnboardingSeenForUser error:", error);
  }
};

export const getOnboardingSeenForUser = async (email) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return false;

    const accounts = await getAccounts();

    const user = accounts.find(
      (acc) => ((acc?.email || "").trim().toLowerCase() === cleanEmail)
    );

    return !!user?.onboardingSeen;
  } catch (error) {
    console.log("getOnboardingSeenForUser error:", error);
    return false;
  }
};

export default function() { return null; }