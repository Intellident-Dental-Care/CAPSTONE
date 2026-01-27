import React from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { colors } from "../theme/colors";

export default function PinkAlert({ visible, title, message, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.primary,
  },
  message: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  btn: {
    marginTop: 18,
    width: "100%",
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },
});
