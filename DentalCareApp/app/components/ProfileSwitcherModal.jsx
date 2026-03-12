import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

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
        <Pressable style={styles.card} onPress={() => {}}>
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
                  <Ionicons
                    name={item.icon || "person"}
                    size={18}
                    color={colors.primary}
                  />
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

              <Pressable style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveText}>Save Profile</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={styles.actionBtn}
            onPress={() => setShowAddInput((prev) => !prev)}
          >
            <Text style={styles.addText}>
              {showAddInput ? "Cancel Add Profile" : "Add Profile"}
            </Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={handleClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
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
    borderRadius: 20,
    padding: 18,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 14,
    textAlign: "center",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  profileIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFE9F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    marginTop: 14,
  },

  input: {
    height: 42,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#333",
  },

  saveBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  actionBtn: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
  },

  addText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E53935",
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
});