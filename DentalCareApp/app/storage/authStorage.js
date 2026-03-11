import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_KEY = "@dc_users";
const SESSION_KEY = "@dc_session_user";
const PATIENT_PROFILES_KEY = "@dc_patient_profiles";

async function readJSON(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

async function writeJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getUsers() {
  return await readJSON(USERS_KEY, []);
}

async function setUsers(users) {
  await writeJSON(USERS_KEY, users);
}

export async function findUserByEmail(email) {
  const users = await getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser({ fullName, email, password }) {
  const users = await getUsers();
  const cleanEmail = email.trim().toLowerCase();

  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) return { ok: false, message: "Email already exists." };

  const newUser = {
    id: Date.now().toString(),
    fullName: fullName.trim(),
    email: cleanEmail,
    password,
    onboardingSeen: false,
    patientSetupDone: false,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await setUsers(users);

  return { ok: true, user: newUser };
}

export async function loginUser(email, password) {
  const users = await getUsers();
  const cleanEmail = email.trim().toLowerCase();

  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!user) return { ok: false, message: "Email not found." };
  if (user.password !== password) return { ok: false, message: "Incorrect password." };

  const patientProfile = await getPatientProfileByEmail(user.email);

  await writeJSON(SESSION_KEY, {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    patientSetupDone: !!patientProfile?.patientSetupDone,
  });

  return {
    ok: true,
    user,
    needsPatientSetup: !patientProfile?.patientSetupDone,
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

export async function getPatientProfiles() {
  return await readJSON(PATIENT_PROFILES_KEY, {});
}

export async function getPatientProfileByEmail(email) {
  if (!email) return null;
  const profiles = await getPatientProfiles();
  return profiles[email.toLowerCase()] || null;
}

export async function savePatientProfile(profileData) {
  const session = await getSession();
  if (!session?.email) {
    return { ok: false, message: "No logged-in user found." };
  }

  const emailKey = session.email.toLowerCase();
  const profiles = await getPatientProfiles();

  const savedProfile = {
    ...profiles[emailKey],
    ...profileData,
    email: session.email,
    patientSetupDone: true,
    updatedAt: new Date().toISOString(),
  };

  profiles[emailKey] = savedProfile;
  await writeJSON(PATIENT_PROFILES_KEY, profiles);

  const users = await getUsers();
  const updatedUsers = users.map((u) =>
    u.email.toLowerCase() === emailKey
      ? {
          ...u,
          fullName: profileData.fullName || u.fullName,
          patientSetupDone: true,
        }
      : u
  );
  await setUsers(updatedUsers);

  await setSession({
    ...session,
    fullName: profileData.fullName || session.fullName,
    patientSetupDone: true,
  });

  return { ok: true, profile: savedProfile };
}

export async function updatePatientProfile(profileData) {
  const session = await getSession();
  if (!session?.email) {
    return { ok: false, message: "No logged-in user found." };
  }

  const emailKey = session.email.toLowerCase();
  const profiles = await getPatientProfiles();
  const existingProfile = profiles[emailKey] || {};

  const updatedProfile = {
    ...existingProfile,
    ...profileData,
    email: session.email,
    patientSetupDone: true,
    updatedAt: new Date().toISOString(),
  };

  profiles[emailKey] = updatedProfile;
  await writeJSON(PATIENT_PROFILES_KEY, profiles);

  const users = await getUsers();
  const updatedUsers = users.map((u) =>
    u.email.toLowerCase() === emailKey
      ? {
          ...u,
          fullName: profileData.fullName || u.fullName,
        }
      : u
  );
  await setUsers(updatedUsers);

  await setSession({
    ...session,
    fullName: profileData.fullName || session.fullName,
    patientSetupDone: true,
  });

  return { ok: true, profile: updatedProfile };
}

export async function hasPatientSetup(email) {
  const profile = await getPatientProfileByEmail(email);
  return !!profile?.patientSetupDone;
}

export async function clearAllAuthStorage() {
  await AsyncStorage.multiRemove([
    USERS_KEY,
    SESSION_KEY,
    PATIENT_PROFILES_KEY,
  ]);
}

export async function updateProfile(profileData) {
  const session = await getSession();
  if (!session?.email) {
    return { ok: false, message: "No logged-in user found." };
  }

  const emailKey = session.email.toLowerCase();

  const users = await getUsers();
  const updatedUsers = users.map((u) =>
    u.email.toLowerCase() === emailKey
      ? {
          ...u,
          fullName: profileData.fullName ?? u.fullName,
        }
      : u
  );
  await setUsers(updatedUsers);

  const currentSession = await getSession();
  await setSession({
    ...currentSession,
    fullName: profileData.fullName ?? currentSession?.fullName,
    email: currentSession?.email,
  });

  const profiles = await getPatientProfiles();
  const existingProfile = profiles[emailKey] || {};

  profiles[emailKey] = {
    ...existingProfile,
    ...profileData,
    email: currentSession?.email,
    patientSetupDone: true,
    updatedAt: new Date().toISOString(),
  };

  await writeJSON(PATIENT_PROFILES_KEY, profiles);

  return { ok: true, profile: profiles[emailKey] };
}