import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_KEY = "@dc_users";
const SESSION_KEY = "@dc_session_user";

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

  await writeJSON(SESSION_KEY, { id: user.id, email: user.email, fullName: user.fullName });

  return { ok: true, user };
}

export async function getSession() {
  return await readJSON(SESSION_KEY, null);
}

export async function logoutUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function setOnboardingSeenForUser(userId) {
  const users = await getUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, onboardingSeen: true } : u));
  await setUsers(updated);
}
