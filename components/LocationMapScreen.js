import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Alert } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import LottieView from "lottie-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import API from "../utils/ApiConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

export default function MapLocationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { photoUri, userData, isLate } = route.params; // terima isLate
  const animationRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [statusText, setStatusText] = useState("Mengecek lokasi Anda...");
  const [distance, setDistance] = useState(null);
  const MAX_DISTANCE_METERS = 100000;

  const companyLocation = {
    latitude: -6.348943186235413,
    longitude: 107.14935415827854,
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin lokasi ditolak",
          "Aplikasi tidak dapat mengakses lokasi."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const currentLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(currentLoc);

      const jarak = getDistanceFromLatLonInMeters(
        currentLoc.latitude,
        currentLoc.longitude,
        companyLocation.latitude,
        companyLocation.longitude
      );
      setDistance(jarak);

      if (jarak <= MAX_DISTANCE_METERS) {
        setStatusText("Anda berada dalam radius kantor, mengirim absensi...");
        await submitAbsensi(photoUri, userData, currentLoc);
      } else {
        setStatusText(
          `Jarak Anda ${Math.round(
            jarak
          )} m dari kantor (maks ${MAX_DISTANCE_METERS} m).`
        );

        setTimeout(() => {
          Alert.alert(
            "Gagal",
            `Jarak Anda (${Math.round(jarak)} m) melebihi batas radius.`,
            [{ text: "OK", onPress: () => navigation.navigate("CameraScreen") }]
          );
        }, 2000);
      }
    })();
  }, []);
  
  const submitAbsensi = async (photoUri, userData) => {
    try {
      const storedTime = await AsyncStorage.getItem("serverTime");
      const now = storedTime ? new Date(storedTime) : new Date();
      const jam = now.toTimeString().split(" ")[0];

      // Ambil shift start & end dari userData, bukan hardcode
      const shiftStart = userData.shift_start; // Contoh: "07:00:00"
      const shiftEnd = userData.shift_end; // Contoh: "16:00:00"
      const shift = userData.id_shift;

      let status_kehadiran = "Hadir";
      if (isLate) {
        status_kehadiran = "Terlambat";
      }

      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        type: "image/jpeg",
        name: `absen_${Date.now()}.jpg`,
      });

      formData.append("absensi", {
        string: JSON.stringify({
          id_pengguna: userData.id_pengguna,
          jam: jam,
          shift_kerja: shift,
          status_kehadiran: status_kehadiran,
        }),
        name: "absensi",
        type: "application/json",
      });

      const response = await fetch(API.ABSEN, {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        body: formData,
      });

      const result = await response.json();

      if (result.status === 200) {
        Alert.alert("Sukses", result.message, [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] }),
          },
        ]);
      } else {
        Alert.alert("Gagal", result.message, [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] }),
          },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", "Terjadi kesalahan saat mengirim absensi");
      console.error("Submit Error:", err);
    }
  };

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: companyLocation.latitude,
          longitude: companyLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        loadingEnabled={true}
      >
        <Marker
          coordinate={companyLocation}
          title="Lokasi Kantor"
          description="Radius valid absensi"
          pinColor="green"
        />
        <Circle
          center={companyLocation}
          radius={MAX_DISTANCE_METERS}
          strokeColor="rgba(46, 123, 232, 0.5)"
          fillColor="rgba(46, 123, 232, 0.2)"
        />
      </MapView>

      <View style={styles.statusContainer}>
        <LottieView
          ref={animationRef}
          source={require("../assets/animations/location.json")}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={styles.statusText}>{statusText}</Text>
        {distance !== null && (
          <Text style={styles.distanceText}>
            Jarak Anda: {Math.round(distance)} meter
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  map: {
    width: width,
    height: height,
  },
  statusContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  lottie: {
    width: 80,
    height: 80,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7BE8",
    textAlign: "center",
    marginVertical: 8,
  },
  distanceText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
});
