import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import CalendarWithHoliday from "./Calendar";
import FormizinPopup from "./FormizinScreen";
import WithLoader from "../utils/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../utils/ApiConfig";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();

  const chartData = [
    {
      name: t("general.masuk"),
      population: 45,
      color: "#2E7BE8",
      legendFontColor: "#444",
      legendFontSize: 12,
    },
    {
      name: t("general.izin"),
      population: 18,
      color: "#FEC107",
      legendFontColor: "#444",
      legendFontSize: 12,
    },
    {
      name: t("general.alfa"),
      population: 36,
      color: "#F44336",
      legendFontColor: "#444",
      legendFontSize: 12,
    },
  ];

  const [currentTime, setCurrentTime] = useState("");
  const [showFormIzin, setShowFormIzin] = useState(false);
  const [userData, setUserData] = useState({
    id_pengguna: null,
    nama_lengkap: "",
    alamat_lengkap: "",
    jam_shift: "",
    foto_pengguna: "",
  });

  const animatedValue = useRef(new Animated.Value(screenHeight)).current;
  const isInitialMount = useRef(true);
  const [loadingTime, setLoadingTime] = useState(true);

  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem("userData");
        const userData = JSON.parse(userDataStr);
        const userId = userData?.id_pengguna;

        if (!userId) return;

        const response = await fetch(`${API.HISTORY}/${userId}`);
        const result = await response.json();

        if (!result?.data) return;

        const hadirData = result.data.filter(
          (item) => item.status_kehadiran === "Hadir"
        );

        let converted = [];
        hadirData.forEach((item) => {
          if (item.jam_masuk) {
            converted.push({
              id: `${item.tanggal}_${item.jam_masuk}_masuk`,
              type: "Masuk Kerja",
              time: item.jam_masuk,
              date: item.tanggal,
            });
          }
          if (item.jam_keluar) {
            converted.push({
              id: `${item.tanggal}_${item.jam_keluar}_pulang`,
              type: "Pulang Kerja",
              time: item.jam_keluar,
              date: item.tanggal,
            });
          }
        });

        // Urutkan dari terbaru ke terlama
        converted = converted.sort((a, b) => {
          const dateTimeA = new Date(`${a.date}T${a.time}`);
          const dateTimeB = new Date(`${b.date}T${b.time}`);
          return dateTimeB - dateTimeA;
        });
        setRecentAttendance(converted.slice(0, 3)); // tampilkan 3 terakhir
      } catch (err) {
        console.log("Error fetching attendance history:", err);
      }
    };

    fetchAttendanceHistory();
  }, []);

  // Animation + userData update when screen focused
  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const dataString = await AsyncStorage.getItem("userData");
          if (dataString) {
            const data = JSON.parse(dataString);
            setUserData({
              id_pengguna: data.id_pengguna || null,
              nama_lengkap: data.nama_lengkap || "",
              alamat_lengkap: data.alamat_lengkap || "",
              jam_shift: data.jam_shift || "",
              foto_pengguna: data.foto_pengguna || "",
            });
          }
        } catch (e) {
          console.log("Failed to get userData:", e);
        }
      };

      fetchUserData();

      if (isInitialMount.current) {
        setTimeout(() => {
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }, 100);
        isInitialMount.current = false;
      } else {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }

      return () => {
        Animated.timing(animatedValue, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };
    }, [animatedValue])
  );

  // Time ticker only (no user data here anymore)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const suffix = hours >= 12 ? "PM" : "AM";
      const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
      setCurrentTime(`${formattedHours}:${minutes} ${suffix}`);
      setLoadingTime(false);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (screenName) => {
    Animated.timing(animatedValue, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate(screenName);
    });
  };

  const formatToAMPM = (time24) => {
    if (!time24) return "-";
    const [hourStr, minute] = time24.split(":");
    const hour = parseInt(hourStr);
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${minute} ${suffix}`;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.blueBackground} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{
              uri: userData.foto_pengguna
                ? userData.foto_pengguna
                : "https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg",
            }}
            style={styles.profileImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>{t("general.welcome")}</Text>
            <Text style={styles.userName}>{userData.nama_lengkap}</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.whiteContainer,
            { transform: [{ translateY: animatedValue }] },
          ]}
        >
          <View style={styles.greyLine} />
          <WithLoader loading={loadingTime}>
            <Text style={styles.time}>{currentTime}</Text>
          </WithLoader>

          <View style={styles.actionCard}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigation("CameraScreen")}
            >
              <Ionicons name="scan" size={24} color="#2E7BE8" />
              <Text style={styles.actionLabel}>{t("general.absen")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowFormIzin(true)}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#2E7BE8"
              />
              <Text style={styles.actionLabel}>{t("general.izin")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("home.staistik")}</Text>
            <PieChart
              data={chartData}
              width={screenWidth - 32}
              height={150}
              chartConfig={{
                backgroundColor: "#fff",
                backgroundGradientFrom: "#fff",
                backgroundGradientTo: "#fff",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
            />
          </View>

          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{t("home.history")}</Text>
              <TouchableOpacity onPress={() => handleNavigation("Riwayat")}>
                <Text style={styles.link}>{t("home.lihat")}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 8 }}>
              {recentAttendance.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      backgroundColor:
                        item.type === "Masuk Kerja" ? "#4CAF50" : "#F44336",
                      borderRadius: 25,
                      width: 40,
                      height: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color="#fff" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color:
                          item.type === "Masuk Kerja" ? "#2E7BE8" : "#F44336",
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      {item.type}
                    </Text>
                    <Text style={{ color: "#888", fontSize: 12 }}>
                      {item.date}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color:
                        item.type === "Masuk Kerja" ? "#4CAF50" : "#F44336",
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    {formatToAMPM(item.time)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("home.calendar")}</Text>
            <View style={styles.calendarContainer}>
              <CalendarWithHoliday />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <FormizinPopup
        visible={showFormIzin}
        onClose={() => setShowFormIzin(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#2E7BE8" },
  blueBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: "transparent",
  },
  profileImage: { width: 56, height: 56, borderRadius: 28, marginRight: 16 },
  headerTextContainer: { flex: 1 },
  welcome: { color: "#fff", fontSize: 13 },
  userName: { color: "#fff", fontWeight: "bold", fontSize: 16, marginTop: 2 },
  whiteContainer: {
    backgroundColor: "#fff",
    marginTop: -12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    height: "100%",
  },
  greyLine: {
    height: 6,
    width: 80,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
  time: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#6B7280",
  },
  actionCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 12,
    elevation: 2,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: "#2E7BE8",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "bold",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#444",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  link: { fontSize: 12, color: "#2E7BE8" },
  calendarContainer: {},
});
