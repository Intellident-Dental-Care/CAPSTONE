import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_KEY = "@dc_users";
const SESSION_KEY = "@dc_session_user";
const ACCOUNT_PROFILES_KEY = "@dc_account_profiles";

async function readJSON(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

async function writeJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

export async function getUsers() {
  return await readJSON(USERS_KEY, []);
}

async function setUsers(users) {
  await writeJSON(USERS_KEY, users);
}

export async function findUserByEmail(email) {
  const users = await getUsers();
  const cleanEmail = normalizeEmail(email);
  return users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function createUser({ fullName, email, password }) {
  const users = await getUsers();
  const cleanEmail = normalizeEmail(email);

  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) return { ok: false, message: "Email already exists." };

  const newUser = {
    id: Date.now().toString(),
    fullName: fullName.trim(),
    email: cleanEmail,
    password,
    onboardingSeen: false,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await setUsers(users);

  return { ok: true, user: newUser };
}

export async function loginUser(email, password) {
  const users = await getUsers();
  const cleanEmail = normalizeEmail(email);

  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) return { ok: false, message: "Email not found." };
  if (user.password !== password) return { ok: false, message: "Incorrect password." };

  const accountProfiles = await getAccountProfilesByEmail(user.email);
  const firstProfile = accountProfiles[0] || null;

  await writeJSON(SESSION_KEY, {
    id: user.id,
    email: user.email,
    accountName: user.fullName,
    onboardingSeen: !!user.onboardingSeen,
    activeProfileId: firstProfile?.id || null,
    activeProfileName: firstProfile?.fullName || user.fullName,
  });

  return {
    ok: true,
    user,
    needsPatientSetup: accountProfiles.length === 0,
  };
}

export async function getSession() {
  return await readJSON(SESSION_KEY, null);
}

export async function setSession(sessionData) {
  await writeJSON(SESSION_KEY, sessionData);
}

export async function logoutUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function setOnboardingSeenForUser(userId) {
  const users = await getUsers();
  const updated = users.map((u) =>
    u.id === userId ? { ...u, onboardingSeen: true } : u
  );
  await setUsers(updated);
}

export async function getAllAccountProfiles() {
  return await readJSON(ACCOUNT_PROFILES_KEY, {});
}

export async function getAccountProfilesByEmail(email) {
  const allProfiles = await getAllAccountProfiles();
  const cleanEmail = normalizeEmail(email);
  return allProfiles[cleanEmail] || [];
}

export async function saveAccountProfilesByEmail(email, profiles) {
  const allProfiles = await getAllAccountProfiles();
  const cleanEmail = normalizeEmail(email);
  allProfiles[cleanEmail] = profiles;
  await writeJSON(ACCOUNT_PROFILES_KEY, allProfiles);
}

export async function getProfilesForCurrentAccount() {
  const session = await getSession();
  if (!session?.email) return [];
  return await getAccountProfilesByEmail(session.email);
}

export async function getActiveProfile() {
  const session = await getSession();
  if (!session?.email || !session?.activeProfileId) return null;

  const profiles = await getAccountProfilesByEmail(session.email);
  return profiles.find((p) => p.id === session.activeProfileId) || null;
}

export async function switchActiveProfile(profileId) {
  const session = await getSession();
  if (!session?.email) {
    return { ok: false, message: "No logged-in user found." };
  }

  const profiles = await getAccountProfilesByEmail(session.email);
  const profile = profiles.find((p) => p.id === profileId);

  if (!profile) {
    return { ok: false, message: "Profile not found." };
  }

  await setSession({
    ...session,
    activeProfileId: profile.id,
    activeProfileName: profile.fullName,
  });

  return { ok: true, profile };
}

export async function savePatientProfile(profileData) {
  const session = await getSession();
  if (!session?.email) {
    return { ok: false, message: "No logged-in user found." };
  }

  const profiles = await getAccountProfilesByEmail(session.email);

  const newProfile = {
    id: Date.now().toString(),
    fullName: profileData.fullName?.trim() || "Profile",
    dob: profileData.dob || "",
    age: profileData.age || "",
    mobile: profileData.mobile || "",
    email: session.email,
    medicalHistory: profileData.medicalHistory || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedProfiles = [...profiles, newProfile];
  await saveAccountProfilesByEmail(session.email, updatedProfiles);

  await setSession({
    ...session,
    activeProfileId: newProfile.id,
    activeProfileName: newProfile.fullName,
  });

  return { ok: true, profile: newProfile };
}

export async function updateProfile(profileData) {
  const session = await getSession();
  if (!session?.email || !session?.activeProfileId) {
    return { ok: false, message: "No active profile found." };
  }

  const profiles = await getAccountProfilesByEmail(session.email);

  let updatedProfile = null;

  const updatedProfiles = profiles.map((p) => {
    if (p.id !== session.activeProfileId) return p;

    updatedProfile = {
      ...p,
      ...profileData,
      fullName: profileData.fullName ?? p.fullName,
      dob: profileData.dob ?? p.dob,
      age: profileData.age ?? p.age,
      mobile: profileData.mobile ?? p.mobile,
      email: session.email,
      medicalHistory: profileData.medicalHistory ?? p.medicalHistory,
      updatedAt: new Date().toISOString(),
    };

    return updatedProfile;
  });

  await saveAccountProfilesByEmail(session.email, updatedProfiles);

  await setSession({
    ...session,
    activeProfileName: updatedProfile?.fullName || session.activeProfileName,
  });

  return { ok: true, profile: updatedProfile };
}

export async function getPatientProfileByEmail(email) {
  const session = await getSession();
  if (!session?.activeProfileId) return null;

  const profiles = await getAccountProfilesByEmail(email);
  return profiles.find((p) => p.id === session.activeProfileId) || null;
}

export async function hasPatientSetup(email) {
  const profiles = await getAccountProfilesByEmail(email);
  return profiles.length > 0;
}

export async function clearAllAuthStorage() {
  await AsyncStorage.multiRemove([
    USERS_KEY,
    SESSION_KEY,
    ACCOUNT_PROFILES_KEY,
  ]);
}