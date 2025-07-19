import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-PRESENT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0052CC", // warna biru mirip gambar
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    color: "#FFFFFF",
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
