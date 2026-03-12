import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCOUNTS_KEY = "accounts";
const SESSION_KEY = "user_session";
const PROFILES_KEY = "profiles_by_email";
const ACTIVE_PROFILE_KEY = "active_profile_by_email";
const PATIENT_PROFILES_KEY = "patient_profiles_by_profile_id";

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
      return {
        success: false,
        message: "Please fill in all fields.",
      };
    }

    const emailExists = accounts.some(
      (acc) => ((acc?.email || "").trim().toLowerCase() === cleanEmail)
    );

    if (emailExists) {
      return {
        success: false,
        message: "Email already exists.",
      };
    }

    const newUser = {
      id: Date.now().toString(),
      fullName: cleanFullName,
      email: cleanEmail,
      password: cleanPassword,
      onboardingSeen: false,
      needsPatientSetup: true,
    };

    const updatedAccounts = [...accounts, newUser];
    await saveAccounts(updatedAccounts);

    await ensureDefaultProfileForEmail(newUser.email, newUser.fullName);

    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    console.log("createUser error:", error);
    return {
      success: false,
      message: "Failed to create user.",
    };
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
      return {
        success: false,
        message: "Invalid email or password.",
      };
    }

    await saveSession(matchedUser);
    await ensureDefaultProfileForEmail(
      matchedUser.email,
      matchedUser.fullName || "User"
    );

    return {
      success: true,
      user: matchedUser,
    };
  } catch (error) {
    console.log("loginUser error:", error);
    return {
      success: false,
      message: "Login failed.",
    };
  }
};

export const updateUser = async (updatedUser) => {
  try {
    const accounts = await getAccounts();

    const updatedAccounts = accounts.map((acc) =>
      acc.id === updatedUser.id ? { ...acc, ...updatedUser } : acc
    );

    await saveAccounts(updatedAccounts);
    await saveSession(updatedUser);

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.log("updateUser error:", error);
    return {
      success: false,
      message: "Failed to update user.",
    };
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

    const rawProfiles = await AsyncStorage.getItem(PROFILES_KEY);
    const parsedProfiles = rawProfiles ? JSON.parse(rawProfiles) : {};
    const deletedProfiles = parsedProfiles[cleanEmail] || [];
    delete parsedProfiles[cleanEmail];
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(parsedProfiles));

    const rawActive = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    const parsedActive = rawActive ? JSON.parse(rawActive) : {};
    delete parsedActive[cleanEmail];
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(parsedActive));

    const rawPatientProfiles = await AsyncStorage.getItem(PATIENT_PROFILES_KEY);
    const parsedPatientProfiles = rawPatientProfiles
      ? JSON.parse(rawPatientProfiles)
      : {};

    deletedProfiles.forEach((profile) => {
      delete parsedPatientProfiles[profile.id];
    });

    await AsyncStorage.setItem(
      PATIENT_PROFILES_KEY,
      JSON.stringify(parsedPatientProfiles)
    );

    const session = await getSession();
    if (((session?.email || "").trim().toLowerCase()) === cleanEmail) {
      await logoutUser();
    }

    return { success: true };
  } catch (error) {
    console.log("deleteUser error:", error);
    return {
      success: false,
      message: "Failed to delete user.",
    };
  }
};

/* =========================
   SESSION FUNCTIONS
========================= */

export const saveSession = async (session) => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.log("saveSession error:", error);
  }
};

export const getSession = async () => {
  try {
    const data = await AsyncStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log("getSession error:", error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.log("logoutUser error:", error);
  }
};

/* =========================
   PROFILE FUNCTIONS
========================= */

export const getProfilesByEmail = async (email) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) return [];

    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed[cleanEmail] || [];
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
      return {
        success: false,
        message: "Profile name is required.",
      };
    }

    const profiles = await getProfilesByEmail(cleanEmail);

    const nameExists = profiles.some(
      (profile) =>
        ((profile?.name || "").trim().toLowerCase() ===
          cleanProfileName.toLowerCase())
    );

    if (nameExists) {
      return {
        success: false,
        message: "Profile name already exists.",
      };
    }

    const newProfile = {
      id: Date.now().toString(),
      name: cleanProfileName,
      icon: "person",
      email: cleanEmail,
      needsPatientSetup: true,
    };

    const updatedProfiles = [...profiles, newProfile];
    await saveProfilesByEmail(cleanEmail, updatedProfiles);

    return {
      success: true,
      profile: newProfile,
      profiles: updatedProfiles,
    };
  } catch (error) {
    console.log("addProfileToEmail error:", error);
    return {
      success: false,
      message: "Failed to add profile.",
    };
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

export const ensureDefaultProfileForEmail = async (
  email,
  fallbackName = "User"
) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return { profiles: [], activeProfile: null };
    }

    let profiles = await getProfilesByEmail(cleanEmail);

    if (profiles.length === 0) {
      const defaultProfile = {
        id: Date.now().toString(),
        name: fallbackName,
        icon: "person",
        email: cleanEmail,
        needsPatientSetup: true,
      };

      profiles = [defaultProfile];
      await saveProfilesByEmail(cleanEmail, profiles);
      await setActiveProfileByEmail(cleanEmail, defaultProfile);

      return {
        profiles,
        activeProfile: defaultProfile,
      };
    }

    let activeProfile = await getActiveProfileByEmail(cleanEmail);
    const stillExists = profiles.find((p) => p.id === activeProfile?.id);

    if (!activeProfile || !stillExists) {
      activeProfile = profiles[0];
      await setActiveProfileByEmail(cleanEmail, activeProfile);
    }

    return {
      profiles,
      activeProfile,
    };
  } catch (error) {
    console.log("ensureDefaultProfileForEmail error:", error);
    return { profiles: [], activeProfile: null };
  }
};

export const updateProfileInAccount = async (email, updatedProfile) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !updatedProfile?.id) {
      return {
        success: false,
        message: "Invalid profile.",
      };
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

    return {
      success: true,
      profiles: updatedProfiles,
    };
  } catch (error) {
    console.log("updateProfileInAccount error:", error);
    return {
      success: false,
      message: "Failed to update profile.",
    };
  }
};

export const getCurrentActiveProfileForSession = async () => {
  try {
    const session = await getSession();
    const cleanEmail = (session?.email || "").trim().toLowerCase();
    if (!cleanEmail) return null;

    const setup = await ensureDefaultProfileForEmail(
      cleanEmail,
      session?.fullName || "User"
    );

    return setup?.activeProfile || (await getActiveProfileByEmail(cleanEmail));
  } catch (error) {
    console.log("getCurrentActiveProfileForSession error:", error);
    return null;
  }
};

/* =========================
   PATIENT PROFILE FUNCTIONS
   SAVED PER PROFILE ID
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
      return {
        success: false,
        message: "Profile id is required.",
      };
    }

    const existingProfiles = await getPatientProfiles();

    existingProfiles[cleanProfileId] = {
      ...(existingProfiles[cleanProfileId] || {}),
      ...payload,
      profileId: cleanProfileId,
    };

    await AsyncStorage.setItem(
      PATIENT_PROFILES_KEY,
      JSON.stringify(existingProfiles)
    );

    return {
      success: true,
      profile: existingProfiles[cleanProfileId],
    };
  } catch (error) {
    console.log("savePatientProfileByProfileId error:", error);
    return {
      success: false,
      message: "Failed to save patient profile.",
    };
  }
};

export const getPatientProfileByProfileId = async (profileId) => {
  try {
    const cleanProfileId = (profileId || "").trim();
    if (!cleanProfileId) return null;

    const profiles = await getPatientProfiles();
    return profiles[cleanProfileId] || null;
  } catch (error) {
    console.log("getPatientProfileByProfileId error:", error);
    return null;
  }
};

export const updatePatientProfileByProfileId = async (profileId, updates) => {
  try {
    const cleanProfileId = (profileId || "").trim();
    if (!cleanProfileId) {
      return {
        success: false,
        message: "Profile id is required.",
      };
    }

    const profiles = await getPatientProfiles();
    const existing = profiles[cleanProfileId] || {};

    profiles[cleanProfileId] = {
      ...existing,
      ...updates,
      profileId: cleanProfileId,
    };

    await AsyncStorage.setItem(PATIENT_PROFILES_KEY, JSON.stringify(profiles));

    return {
      success: true,
      profile: profiles[cleanProfileId],
    };
  } catch (error) {
    console.log("updatePatientProfileByProfileId error:", error);
    return {
      success: false,
      message: "Failed to update patient profile.",
    };
  }
};

export const setPatientSetupDoneForProfile = async (email, profileId) => {
  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanProfileId = (profileId || "").trim();

    if (!cleanEmail || !cleanProfileId) return;

    const profiles = await getProfilesByEmail(cleanEmail);
    const updatedProfiles = profiles.map((profile) =>
      profile.id === cleanProfileId
        ? { ...profile, needsPatientSetup: false }
        : profile
    );

    await saveProfilesByEmail(cleanEmail, updatedProfiles);

    const activeProfile = await getActiveProfileByEmail(cleanEmail);
    if (activeProfile?.id === cleanProfileId) {
      await setActiveProfileByEmail(cleanEmail, {
        ...activeProfile,
        needsPatientSetup: false,
      });
    }
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

    const session = await getSession();
    if (((session?.email || "").trim().toLowerCase()) === cleanEmail) {
      const updatedSession = { ...session, needsPatientSetup: false };
      await saveSession(updatedSession);
    }
  } catch (error) {
    console.log("setPatientSetupDoneForUser error:", error);
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

    const session = await getSession();
    if (((session?.email || "").trim().toLowerCase()) === cleanEmail) {
      const updatedSession = { ...session, onboardingSeen: true };
      await saveSession(updatedSession);
    }
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