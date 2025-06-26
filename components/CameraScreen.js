import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CameraScreen() {
  const [facing, setFacing] = useState("front");
  const [flash, setFlash] = useState("on");
  const [currentTime, setCurrentTime] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (permission && permission.status === "denied") {
      navigation.navigate("MainTabs");
    }
  }, [permission]);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={{ color: "#fff" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleFlash() {
    setFlash((current) => (current === "off" ? "on" : "off"));
  }

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      {/* Header peringatan */}
      <View style={styles.headerContainer}>
        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <Ionicons name="information-circle" size={20} color="#F44336" />
            <Text style={styles.warningTitle}> Peringatan</Text>
          </View>
          <Text style={styles.warningText}>
            1. Pastikan wajah terlihat jelas ketika melakukan absensi.{"\n"}
            2. Pastikan GPS dan Kamera On dan bisa diakses oleh aplikasi.
          </Text>
        </View>
      </View>

      {/* Kamera */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing={facing} flash={flash}>
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTime}>{currentTime}</Text>
          </View>
        </CameraView>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#2E7BE8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton}>
          <Ionicons name="camera-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleFlash}>
          <Ionicons
            name={flash === "off" ? "flash-off-outline" : "flash-outline"}
            size={28}
            color="#2E7BE8"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#2E7BE8",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionButton: {
    backgroundColor: "#2E7BE8",
    padding: 12,
    borderRadius: 8,
  },
  headerContainer: {
    padding: 16,
  },
  warningBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "flex-start",
    elevation: 4,
    marginVertical: 20,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningTitle: {
    fontWeight: "bold",
    color: "#F44336",
    marginTop: 4,
  },
  warningText: {
    marginTop: 12,
    fontSize: 12,
    color: "#333",
  },
  cameraContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  camera: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraOverlay: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  cameraTime: {
    fontSize: 44,
    color: "#fff",
    fontWeight: "bold",
  },
  footer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 12,
  },
  captureButton: {
    backgroundColor: "#2E7BE8",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12, // ✅ Tambah jarak ke bawah tombol kamera
  },
});
