import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { getSignedProfileAvatarUrl } from "../../server/UserProfile/profileImageService";

function ProfileAvatar({ profile }) {
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const avatarRef = profile?.avatarUrl || profile?.avatar_url || "";
      if (!avatarRef) {
        if (isMounted) setAvatarUrl("");
        return;
      }

      try {
        const signedUrl = await getSignedProfileAvatarUrl(avatarRef);
        if (isMounted) setAvatarUrl(signedUrl || avatarRef);
      } catch (_) {
        if (isMounted) setAvatarUrl(avatarRef);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [profile?.avatarUrl, profile?.avatar_url]);

  if (!avatarUrl) {
    return <Ionicons name="person" size={18} color={colors.primary} />;
  }

  return <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />;
}

export default function ProfileSwitcherModal({
  visible,
  onClose,
  profiles = [],
  selectedProfile,
  onSelectProfile,
  onAddProfile,
  onLogout,
}) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  const handleAdd = async () => {
    const cleanName = newProfileName.trim();
    if (!cleanName) return;

    await onAddProfile?.(cleanName);
    setNewProfileName("");
    setShowAddInput(false);
  };

  const handleClose = () => {
    setShowAddInput(false);
    setNewProfileName("");
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.card}>
          <Text style={styles.title}>Choose Profile</Text>

          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.profileRow}
                onPress={() => {
                  onSelectProfile?.(item);
                  handleClose();
                }}
              >
                <View style={styles.profileIconWrap}>
                  <ProfileAvatar profile={item} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>
                    {item.name || item.fullName || "User"}
                  </Text>
                  <Text style={styles.profileSubText}>
                    {item.email || "Patient Profile"}
                  </Text>
                </View>

                {selectedProfile?.id === item.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No profiles available.</Text>
            }
          />

          {showAddInput && (
            <View style={styles.addWrap}>
              <TextInput
                value={newProfileName}
                onChangeText={setNewProfileName}
                placeholder="Enter profile name"
                placeholderTextColor="#999"
                style={styles.input}
              />

              <Pressable
                style={styles.saveBtn}
                onPress={handleAdd}
                disabled={!newProfileName.trim()}
              >
                <Text style={styles.saveText}>Save Profile</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[
              styles.actionBtn,
              showAddInput ? styles.cancelAddBtn : styles.addBtn,
            ]}
            onPress={() => setShowAddInput((prev) => !prev)}
          >
            <Text style={showAddInput ? styles.cancelAddText : styles.addText}>
              {showAddInput ? "Cancel Add Profile" : "Add Profile"}
            </Text>
          </Pressable>

          <Pressable
              style={[styles.actionBtn, styles.logoutBtn]}
              onPress={() => {
                handleClose();
                onLogout?.();
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>

          <Pressable style={[styles.actionBtn, styles.closeBtn]} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 14,
    textAlign: "center",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF9FB",
    borderWidth: 1,
    borderColor: "#F8D4E0",
    marginBottom: 10,
  },

  profileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },

  profileAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 19,
  },

  profileName: {
    fontSize: 14,
    color: "#444",
    fontWeight: "700",
  },

  profileSubText: {
    marginTop: 2,
    fontSize: 10,
    color: "#888",
  },

  emptyText: {
    textAlign: "center",
    color: "#888",
    marginVertical: 10,
    fontSize: 13,
  },

  addWrap: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFF9FB",
    borderWidth: 1,
    borderColor: "#F8D4E0",
  },

  addBtn: {
    backgroundColor: colors.primary,
  },


  input: {
    height: 42,
    borderWidth: 1,
    borderColor: "#F8D4E0",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#333",
    backgroundColor: "#fff",
  },

  saveBtn: {
    marginTop: 10,
    backgroundColor: "#2FA55A",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelAddBtn: {
    backgroundColor: "#F59E0B",
  },

  logoutBtn: {
    backgroundColor: "#FFE8E8",
    borderWidth: 1,
    borderColor: "#FFCACA",
  },

  closeBtn: {
    backgroundColor: "#F3F4F6",
  },

  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },

  actionBtn: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
  },

  addText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  cancelAddText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E53935",
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#666",
  },
});