import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme/colors";
import { logoutUser } from "../storage/authStorage";

export default function ProfileSwitcherModal({
  visible,
  onClose,
  profiles = [],
  selectedProfile,
  onSelectProfile,
}) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Choose Profile</Text>

          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={styles.profileRow}
                onPress={() => {
                  onSelectProfile?.(item);
                  onClose?.();
                }}
              >
                <View style={styles.profileIconWrap}>
                  <Ionicons
                    name={item.icon || "person"}
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.profileName}>{item.name}</Text>

                {selectedProfile?.id === item.id && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No profiles available.</Text>
            }
          />

          <Pressable
            style={styles.actionBtn}
            onPress={async () => {
              onClose?.();
              await logoutUser();
              router.replace("/get-started");
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={onClose}>
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
    flex: 1,
    fontSize: 14,
    color: "#444",
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    color: "#888",
    marginVertical: 10,
    fontSize: 13,
  },

  actionBtn: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F7F7F7",
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