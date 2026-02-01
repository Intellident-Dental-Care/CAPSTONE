import AsyncStorage from "@react-native-async-storage/async-storage";

const OTP_VERIFIED_KEY = "otp_verified_emails_v1";

export async function markOtpVerified(email) {
  const key = (email || "").trim().toLowerCase();
  if (!key) return;

  const raw = await AsyncStorage.getItem(OTP_VERIFIED_KEY);
  const list = raw ? JSON.parse(raw) : [];

  if (!Array.isArray(list)) {
    await AsyncStorage.setItem(OTP_VERIFIED_KEY, JSON.stringify([key]));
    return;
  }

  if (!list.includes(key)) {
    list.push(key);
    await AsyncStorage.setItem(OTP_VERIFIED_KEY, JSON.stringify(list));
  }
}
