import { supabase } from "../supabaseService";
import { decode } from "base64-arraybuffer";

const PROFILE_BUCKET = "profile-uploads";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function sanitizeProfileName(value, fallback = "profile") {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return cleaned || fallback;
}

function sanitizeUserId(value) {
  return String(value || "").trim().replace(/[\\/]+/g, "_");
}

function getFileExtension(uri) {
  const cleanUri = String(uri || "").split("?")[0].split("#")[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return (match?.[1] || "jpg").toLowerCase();
}

function getContentType(extension) {
  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
}

function base64ToArrayBuffer(base64String) {
  if (!base64String) {
    throw new Error("Missing image data.");
  }

  return decode(base64String);
}

export function buildProfileAvatarPath({ userId, profileName, isMainProfile }) {
  const safeUserId = sanitizeUserId(userId) || "user_unknown";
  const safeProfileName = sanitizeProfileName(profileName, "profile");
  const profileFolder = isMainProfile ? "profile_main" : `profile_${safeProfileName}`;
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const fileName = `avatar_${uniqueSuffix}.jpg`;

  return {
    folderPath: `user_${safeUserId}/${profileFolder}`,
    storagePath: `user_${safeUserId}/${profileFolder}/${fileName}`,
    fileName,
  };
}

export async function uploadProfileAvatar({ uri, base64, userId, profileName, isMainProfile }) {
  const cleanUri = String(uri || "").trim();
  const cleanBase64 = String(base64 || "").trim();
  const cleanUserId = sanitizeUserId(userId);
  const cleanProfileName = String(profileName || "").trim();

  if (!cleanUri) {
    return { success: false, message: "Image URI is required." };
  }

  if (!cleanUserId) {
    return { success: false, message: "User ID is required." };
  }

  const fileExtension = getFileExtension(cleanUri);
  const contentType = getContentType(fileExtension);
  const safeProfileName = sanitizeProfileName(cleanProfileName, "profile");
  const profileFolder = isMainProfile ? "profile_main" : `profile_${safeProfileName}`;
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const storagePath = `user_${cleanUserId}/${profileFolder}/avatar_${uniqueSuffix}.${fileExtension}`;

  try {
    const fileBody = cleanBase64 ? base64ToArrayBuffer(cleanBase64) : null;

    if (!fileBody) {
      throw new Error("Missing image data.");
    }

    console.log("Uploading profile avatar:", {
      bucket: PROFILE_BUCKET,
      storagePath,
      contentType,
      userId: cleanUserId,
      profileFolder,
    });

    const { error: uploadError } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(storagePath, fileBody, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.warn("Supabase avatar upload error:", uploadError);
      return { success: false, message: uploadError.message };
    }

    const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(storagePath);

    return {
      success: true,
      storagePath,
      publicUrl: data?.publicUrl || "",
      folderPath: `user_${cleanUserId}/${profileFolder}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "Failed to upload profile image.",
    };
  }
}

function extractStoragePath(source) {
  const value = String(source || "").trim();
  if (!value) return "";

  if (!value.startsWith("http")) {
    return value;
  }

  try {
    const url = new URL(value);
    const marker = `/object/public/${PROFILE_BUCKET}/`;
    const signedMarker = `/object/sign/${PROFILE_BUCKET}/`;
    const publicIndex = url.pathname.indexOf(marker);
    if (publicIndex >= 0) {
      return decodeURIComponent(url.pathname.slice(publicIndex + marker.length));
    }

    const signedIndex = url.pathname.indexOf(signedMarker);
    if (signedIndex >= 0) {
      return decodeURIComponent(url.pathname.slice(signedIndex + signedMarker.length));
    }
  } catch (_) {}

  return "";
}

export async function getSignedProfileAvatarUrl(source) {
  const storagePath = extractStoragePath(source);

  if (!storagePath) {
    return String(source || "").trim();
  }

  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data?.signedUrl || "";
}

export function getStoredProfileAvatarPath(source) {
  const value = String(source || "").trim();
  if (!value) return "";

  if (!value.startsWith("http")) {
    return value;
  }

  return extractStoragePath(value);
}