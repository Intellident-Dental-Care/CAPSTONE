// Shared module-level cache for profile screens.
// Persists in memory across navigation (unmount/remount) for the lifetime of the app session.

export const profileIndexCache = {
  loaded: false,
  fullName: "",
  email: "",
  profiles: [],
  selectedProfile: null,
  loggedInEmail: "",
};

export const myProfileCache = {
  loaded: false,
  profileId: "",
  accountEmail: "",
  fullName: "",
  dob: "",
  mobile: "",
  email: "",
};

// Per-profile appointment cache: { [profileId]: { data, fetchedAt } }
// fetchedAt is a Date.now() timestamp; stale after APPOINTMENT_CACHE_TTL_MS.
export const appointmentCache = {};
export const APPOINTMENT_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function clearAppointmentCacheForProfile(profileId) {
  if (profileId) delete appointmentCache[profileId];
}

// Full appointments list cache (same TTL)
export const appointmentsListCache = {};

// Dentist directory cache (list + branch filters) keyed by user scope.
export const dentistListCache = {};
export const DENTIST_LIST_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function clearAllProfileCaches() {
  Object.assign(profileIndexCache, {
    loaded: false,
    fullName: "",
    email: "",
    profiles: [],
    selectedProfile: null,
    loggedInEmail: "",
  });
  Object.assign(myProfileCache, {
    loaded: false,
    profileId: "",
    accountEmail: "",
    fullName: "",
    dob: "",
    mobile: "",
    email: "",
  });
  // Clear all appointment cache entries
  Object.keys(appointmentCache).forEach((k) => delete appointmentCache[k]);
  Object.keys(appointmentsListCache).forEach((k) => delete appointmentsListCache[k]);
  Object.keys(dentistListCache).forEach((k) => delete dentistListCache[k]);
}
