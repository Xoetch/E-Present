import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WithLoader from "../utils/Loader";
import API from "../utils/ApiConfig";
import CustomAlert from "../utils/CustomAlert";

export default function CameraScreen() {
  const [facing, setFacing] = useState("front");
  const [flash, setFlash] = useState("on");
  const [currentTime, setCurrentTime] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const [userData, setUserData] = useState(null);
  const [isAllowedTime, setIsAllowedTime] = useState(false);
  const [loadingTime, setLoadingTime] = useState(true);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);

  const [hasClockInToday, setHasClockInToday] = useState(false);
  const [isLate, setIsLate] = useState(false);
  const [isBeforeEndShift, setIsBeforeEndShift] = useState(false);
  const [absenHistory, setAbsenHistory] = useState([]);
  const [hasClockOutToday, setHasClockOutToday] = useState(false);

  const [isAfterShiftPlusOneHour, setIsAfterShiftPlusOneHour] = useState(false);
  const [isAfterShift, setIsAfterShift] = useState(false);

  const getAbsenHistory = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      const parsedUserData = JSON.parse(userData);
      const userId = parsedUserData?.id_pengguna || parsedUserData?.id;

      if (!userId) {
        console.warn("User ID tidak ditemukan.");
        return;
      }

      const response = await fetch(`${API.HISTORY}/${userId}`);
      const result = await response.json(); // Ambil JSON-nya

      if (!Array.isArray(result?.data)) {
        console.warn("Data riwayat absen tidak dalam format array.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const todayAttendance = result.data.find(
        (item) => item.tanggal === today
      );

      setAbsenHistory(result.data || []);
      setHasClockInToday(!!todayAttendance?.jam_masuk);
      setHasClockOutToday(!!todayAttendance?.jam_keluar);
    } catch (error) {
      console.error("Gagal fetch riwayat absen", error);
    }
  };


  const fetchUserData = async () => {
    try {
      const dataString = await AsyncStorage.getItem("userData");
      if (!dataString) throw new Error("Data pengguna tidak ditemukan");

      const data = JSON.parse(dataString);
      setUserData(data);

      const jamShift = data.jam_shift; 
      if (!jamShift || !jamShift.includes(" - ")) {
        throw new Error("Format jam_shift tidak valid");
      }

      const [jam_masuk, jam_pulang] = jamShift
        .split(" - ")
        .map((jam) => jam.trim() + ":00");

      const now = new Date();
      const currentInSeconds =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const [sh, sm, ss] = jam_masuk.split(":").map(Number);
      const [eh, em, es] = jam_pulang.split(":").map(Number);

      const start = sh * 3600 + sm * 60 + ss;
      const end = eh * 3600 + em * 60 + es;
      const oneHour = 3600;

      const isAfter = currentInSeconds >= end;
      setIsAfterShift(isAfter);

      const late = currentInSeconds > start;
      setIsLate(late);

      const beforeEnd = currentInSeconds < end;
      setIsBeforeEndShift(beforeEnd);

      // Cek apakah saat ini masih dalam range shift
      let allowed = false;
      if (start < end) {
        allowed = currentInSeconds >= start && currentInSeconds <= end;
      }
      setIsAllowedTime(allowed);

      //  Cek sudah lebih dari 1 jam dari shift pulang
      const isAfterOneHourShift = currentInSeconds > end + oneHour;
      setIsAfterShiftPlusOneHour(isAfterOneHourShift);
    } catch (e) {
    console.log("Gagal mengambil shift dari userData:", e);
    CustomAlert.error(
      "Gagal Memproses Data",
      "Tidak dapat memproses jam shift pengguna. Silakan periksa data shift Anda atau hubungi administrator.",
      [
        {
          text: "OK",
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          })
        }
      ]
    );
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
        await getAbsenHistory();
        const { status } = await requestPermission();
        if (status !== "granted") {
          CustomAlert.error(
            "Izin Kamera Ditolak",
            "Aplikasi memerlukan akses kamera untuk melakukan absensi. Silakan aktifkan izin kamera di pengaturan aplikasi.",
            [
              { 
                text: "Batal", 
                style: "cancel",
                onPress: () => navigation.reset({
                  index: 0,
                  routes: [{ name: "MainTabs" }],
                })
              },
              {
                text: "Buka Pengaturan",
                onPress: () => {
                  Linking.openSettings();
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "MainTabs" }],
                  });
                }
              },
            ]
          );
        }
      })();
    }, [])
  );

  useEffect(() => {
    if (!userData || !userData.jam_shift) return;

    const updateShiftStatus = () => {
      const [jam_masuk, jam_pulang] = userData.jam_shift
        .split(" - ")
        .map((jam) => jam.trim() + ":00");

      const now = new Date();
      const currentInSeconds =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const [sh, sm, ss] = jam_masuk.split(":").map(Number);
      const [eh, em, es] = jam_pulang.split(":").map(Number);

      const start = sh * 3600 + sm * 60 + ss;
      const end = eh * 3600 + em * 60 + es;
      const oneHour = 3600;

      setIsAfterShift(currentInSeconds >= end);
      setIsLate(currentInSeconds > start);
      setIsBeforeEndShift(currentInSeconds < end);

      let allowed = false;
      if (start < end) {
        allowed = currentInSeconds >= start && currentInSeconds <= end;
      }
      setIsAllowedTime(allowed);

      setIsAfterShiftPlusOneHour(currentInSeconds > end + oneHour);
    };

    updateShiftStatus(); // initial check

    const interval = setInterval(updateShiftStatus, 60000); // update setiap menit

    return () => clearInterval(interval);
  }, [userData]);

  useMemo(() => {
    if (!userData || !userData.jam_shift || !currentTime) return;

    const [jam_masuk, jam_pulang] = userData.jam_shift
      .split(" - ")
      .map((jam) => jam.trim() + ":00");

    const [sh, sm, ss] = jam_masuk.split(":").map(Number);
    const [eh, em, es] = jam_pulang.split(":").map(Number);

    const start = sh * 3600 + sm * 60 + ss;
    const end = eh * 3600 + em * 60 + es;
    const oneHour = 3600;

    // Ambil jam, menit, detik dari currentTime
    const [ch, cm, cs] = currentTime.split(":").map(Number);
    const currentInSeconds = ch * 3600 + cm * 60 + cs;

    setIsAfterShift(currentInSeconds >= end);
    setIsLate(currentInSeconds > start);
    setIsBeforeEndShift(currentInSeconds < end);

    let allowed = false;
    if (start < end) {
      allowed = currentInSeconds >= start && currentInSeconds <= end;
    }
    setIsAllowedTime(allowed);

    setIsAfterShiftPlusOneHour(currentInSeconds > end + oneHour);
  }, [userData, currentTime]);

  if (!permission) return <View style={styles.container} />;

  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      const userDataString = await AsyncStorage.getItem("userData");
      const userData = JSON.parse(userDataString);

      navigation.navigate("LocationMap", {
        photoUri: photo.uri,
        userData: userData,
        isLate: isLate, // kirim nilai isLate sebagai props
      });
    } catch (error) {
      console.log("Capture error:", error);
      CustomAlert.error(
        "Gagal Mengambil Foto",
        "Terjadi kesalahan saat mengambil foto. Pastikan kamera berfungsi dengan baik dan coba lagi.",
        [
          {
            text: "OK",
            onPress: () => {
              // User bisa mencoba lagi tanpa navigasi keluar
            }
          }
        ]
      );
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
            <View style={{ flexDirection: "row", gap: 8 }}>
              {hasClockInToday && !hasClockOutToday && (
                <View
                  style={[styles.warningCard, { backgroundColor: "#E0F7FA" }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#00796B" />
                  <Text style={styles.warningText}>Sudah absen masuk</Text>
                </View>
              )}

              {hasClockOutToday && (
                <View
                  style={[styles.warningCard, { backgroundColor: "#E0F7FA" }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#00796B" />
                  <Text style={styles.warningText}>Sudah absen pulang</Text>
                </View>
              )}

              {!hasClockInToday &&
                isLate &&
                !isAfterShift &&(
                  <View
                    style={[styles.warningCard, { backgroundColor: "#FFCDD2" }]}
                  >
                    <Ionicons name="alert-circle" size={20} color="#C62828" />
                    <Text style={styles.warningText}>Telat absensi</Text>
                  </View>
                )}

              {hasClockInToday && !hasClockOutToday && isBeforeEndShift && (
                <View
                  style={[styles.warningCard, { backgroundColor: "#FFF9C4" }]}
                >
                  <Ionicons name="time" size={20} color="#FBC02D" />
                  <Text style={styles.warningText}>Belum waktu pulang</Text>
                </View>
              )}
            </View>

            <WithLoader loading={loadingTime}>
              <Text style={styles.cameraTime}>{currentTime}</Text>
            </WithLoader>
          </View>
        </CameraView>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] })
          }
        >
          <Ionicons name="arrow-back" size={28} color="#2E7BE8" />
        </TouchableOpacity>

        <View style={styles.captureWrapper}>
          <TouchableOpacity
            style={[
              styles.captureButton,
              (hasClockInToday && !hasClockOutToday && isBeforeEndShift) ||
              isAfterShiftPlusOneHour
                ? { backgroundColor: "gray" }
                : null,
            ]}
            onPress={() => {
              if (isAfterShiftPlusOneHour) {
                Alert.alert(
                  "Terlambat Absensi",
                  "Anda sudah melewati batas waktu absensi (1 jam setelah jam pulang)."
                );
                return;
              }

              if (!hasClockInToday && isAfterShift) {
                Alert.alert(
                  "Alpa",
                  "Anda tidak bisa absen setelah shift berakhir"
                );
                return;
              }

              if (hasClockInToday && !hasClockOutToday && isBeforeEndShift) {
                CustomAlert.warning(
                  "Belum Waktu Pulang",
                  "Anda belum bisa melakukan absen pulang karena jam kerja belum selesai. Silakan tunggu hingga waktu pulang tiba.",
                  [
                    {
                      text: "Mengerti",
                      onPress: () =>
                        navigation.reset({
                          index: 0,
                          routes: [{ name: "MainTabs" }],
                        }),
                    },
                  ]
                );
              } else {
                handleCapture();
              }
            }}
          >
            <Ionicons
              name="camera-outline"
              size={28}
              color={
                (hasClockInToday && !hasClockOutToday && isBeforeEndShift) ||
                isAfterShiftPlusOneHour
                  ? "#ccc"
                  : "#fff"
              }
            />
          </TouchableOpacity>
        </View>

        {/* Spacer kanan */}
        <View style={{ width: 28 }} />
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
    justifyContent: "space-between", // lebih natural tanpa tombol tengah yang menggantung
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
  },

  captureButton: {
    backgroundColor: "#2E7BE8",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // untuk Android shadow
  },

  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  warningText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});