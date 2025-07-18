import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useEffect, useRef, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WithLoader from "../utils/Loader";

export default function CameraScreen() {
  const [facing, setFacing] = useState("front");
  const [flash, setFlash] = useState("on");
  const [currentTime, setCurrentTime] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const [userData, setUserData] = useState(null);
  const [isAllowedTime, setIsAllowedTime] = useState(false);
  const [hasShownAlert, setHasShownAlert] = useState(false);
  const [loadingTime, setLoadingTime] = useState(true);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);

  const timeToSeconds = (timeStr) => {
    const [h, m, s] = timeStr.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const fetchUserData = async () => {
    try {
      const dataString = await AsyncStorage.getItem("userData");
      if (dataString) {
        const data = JSON.parse(dataString);
        setUserData(data);

        const now = new Date();
        const currentInSeconds =
          now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

        const shift = data.jam_shift?.toLowerCase();
        const [startStr, endStr] = data.jam_shift.split(" - ");
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);

        const start = sh * 3600 + sm * 60;
        const end = eh * 3600 + em * 60;

        console.log("Jam sekarang:", currentInSeconds);
        console.log("Jam shift:", start, "-", end);

        let allowed = false;
        if (start < end) {
          allowed = currentInSeconds >= start && currentInSeconds <= end;
        } else {
          allowed = currentInSeconds >= start || currentInSeconds <= end;
        }

        console.log("Diperbolehkan?", allowed);

        if (!allowed) {
          Alert.alert(
            "Akses Ditolak",
            "Kamera hanya dapat digunakan sesuai jam shift Anda.",
            [
              {
                text: "OK",
                onPress: () => {
                  navigation.navigate("MainTabs");
                },
              },
            ]
          );
        }

        setIsAllowedTime(allowed);
      }
    } catch (e) {
      console.log("Gagal mengambil Shift:", e);
      Alert.alert("Gagal", "Tidak dapat mengambil data shift pengguna.");
      navigation.navigate("MainTabs");
    }
  };

  // Timer realtime jam
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
            setLoadingTime(false);

    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ambil data dan permission saat screen aktif
  useFocusEffect(
    useCallback(() => {
      (async () => {
        await fetchUserData();
        const { status } = await requestPermission();
        if (status !== "granted") {
          alert("Izin kamera ditolak");
        }
      })();
    }, [])
  );

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={{ color: "#fff" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      const userDataString = await AsyncStorage.getItem("userData");
      const userData = JSON.parse(userDataString);

      navigation.navigate("LocationMap", {
        photoUri: photo.uri,
        userData: userData,
      });
    } catch (error) {
      console.log("Capture error:", error);
      alert("Terjadi kesalahan saat mengambil foto");
    }
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      {/* Header Peringatan */}
      <View style={styles.headerContainer}>
        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <Ionicons name="information-circle" size={20} color="#F44336" />
            <Text style={styles.warningTitle}> Peringatan</Text>
          </View>
          <Text style={styles.warningText}>
            1. Pastikan wajah terlihat jelas ketika melakukan absensi.{"\n"}
            2. Pastikan GPS dan Kamera aktif serta bisa diakses aplikasi.
          </Text>
        </View>
      </View>

      {/* Kamera */}
      <View style={styles.cameraContainer}>
        <CameraView
          key={facing}
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          <View style={styles.cameraOverlay}>
            <WithLoader loading={loadingTime}>
              <Text style={styles.cameraTime}>{currentTime}</Text>
            </WithLoader>
          </View>
        </CameraView>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Ionicons name="arrow-back" size={28} color="#2E7BE8" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
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
  wrapper: { flex: 1, backgroundColor: "#2E7BE8" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  permissionButton: {
    backgroundColor: "#2E7BE8",
    padding: 12,
    borderRadius: 8,
  },
  headerContainer: { padding: 16 },
  warningBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "flex-start",
    elevation: 4,
    marginVertical: 20,
  },
  warningHeader: { flexDirection: "row", alignItems: "center" },
  warningTitle: { fontWeight: "bold", color: "#F44336", marginTop: 4 },
  warningText: { marginTop: 12, fontSize: 12, color: "#333" },
  cameraContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  camera: { flex: 1, alignItems: "center", justifyContent: "center" },
  cameraOverlay: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  cameraTime: { fontSize: 44, color: "#fff", fontWeight: "bold" },
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
    marginBottom: 12,
  },
});
