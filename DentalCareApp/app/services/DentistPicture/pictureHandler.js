import React, { useState, useEffect } from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Using the corrected path from earlier
import { supabase } from "../../../server/supabaseService"; 

export default function DentistAvatar({
  dentistId,
  predefinedPath,
  style,
  iconSize = 22,
  fallbackColor = "#2F7DFF"
}) {
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    let active = true;

    const loadPic = async () => {
      try {
        let path = predefinedPath;

        // 1. Fetch the path from the database if we only have the ID
        if (!path && dentistId) {
          const { data, error } = await supabase
            .from('dentist_list')
            .select('profile_photo_url')
            .eq('id', dentistId)
            .single();

          if (!error && data?.profile_photo_url) {
            path = data.profile_photo_url;
          }
        }

        // 2. Turn the path into a direct URL for React Native's <Image> component
        if (path && active) {
          if (path.startsWith("http") || path.startsWith("data:")) {
            setImageUri(path);
          } else {
            // First, try to generate a Signed URL (Required if 'profile-uploads' is a private bucket)
            // This URL will be valid for 7 days (604800 seconds)
            const { data: signedData, error: signedError } = await supabase
              .storage
              .from('profile-uploads')
              .createSignedUrl(path, 60 * 60 * 24 * 7);

            if (signedData?.signedUrl) {
              console.log("Successfully generated Signed URL");
              if (active) setImageUri(signedData.signedUrl);
            } else {
              // If Signed URL fails (e.g., bucket is public and doesn't need signatures), 
              // fall back to getting the standard Public URL
              console.log("Signed URL failed, falling back to Public URL");
              const { data: publicData } = supabase
                .storage
                .from('profile-uploads')
                .getPublicUrl(path);

              if (publicData?.publicUrl && active) {
                setImageUri(publicData.publicUrl);
              }
            }
          }
        }
      } catch (e) {
        console.log("Outer catch error in loadPic:", e);
      }
    };
    
    loadPic();
    
    return () => { active = false; };
  }, [dentistId, predefinedPath]);

  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[style, { overflow: "hidden" }]} resizeMode="cover" />;
  }

  return (
    <View style={style}>
      <Ionicons name="person" size={iconSize} color={fallbackColor} />
    </View>
  );
}