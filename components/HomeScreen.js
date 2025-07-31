import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const [currentDateStr, setCurrentDateStr] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`; // hasilnya format YYYY-MM-DD sesuai zona lokal
  });

  const [todayAttendance, setTodayAttendance] = useState({
    jam_masuk: null,
    jam_keluar: null,
  });

  const [chartData, setChartData] = useState([]);
  const today = new Date().toISOString().split("T")[0];

  const [currentTime, setCurrentTime] = useState("");
  const [showFormIzin, setShowFormIzin] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const [userData, setUserData] = useState({
    id_pengguna: null,
    nama_lengkap: "",
    alamat_lengkap: "",
    shift_mulai: "",
    shift_selesai: "",
    foto_pengguna: "",
  });

  const animatedValue = useRef(new Animated.Value(screenHeight)).current;
  const isInitialMount = useRef(true);
  const [loadingTime, setLoadingTime] = useState(true);

  const [recentAttendance, setRecentAttendance] = useState([]);

  const formatToAMPM = (time24) => {
    if (!time24) return "-";
    const [hourStr, minute] = time24.split(":");
    const hour = parseInt(hourStr);
    return `${hourStr}:${minute} `;
  };

  const mapLabelToTranslationKey = (apiLabel) => {
    const normalizedLabel = apiLabel.toLowerCase();
    if (normalizedLabel.includes("alfa") || normalizedLabel.includes("alpa")) return "general.alfa";
    if (normalizedLabel.includes("terlambat")) return "history.telat";
    if (normalizedLabel.includes("tidak absen pulang")) return "history.tidakAbsen";
    if (normalizedLabel.includes("izin")) return "general.izin";
    if (normalizedLabel.includes("hadir")) return "general.hadir";
    return "general.lain";
  };

  const getColorByStatus = (translationKey) => {
    switch (translationKey) {
      case "general.alfa":
        return "#F44336";
      case "history.telat":
        return "#FF7043";
      case "history.tidakAbsen":
        return "#FF8A65";
      case "general.izin":
        return "#FFC107";
      case "general.hadir":
        return "#4CAF50";
      default:
        return "#9E9E9E";
    }
  };

  // Chart configuration for react-native-chart-kit
  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  // Calculate responsive chart dimensions for side-by-side layout
  const getChartDimensions = () => {
    const cardPadding = 100; // padding kiri kanan card (20 * 2)
    const availableWidth = screenWidth - cardPadding;
    // Increase chart width to prevent cutting and ensure proper display
    const chartWidth = Math.min(availableWidth * 0.55, 180);
    const chartHeight = chartWidth;

    return {
      width: chartWidth,
      height: chartHeight,
    };
  };

  const ResponsiveLegend = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.responsiveLegendContainer}>
          <Text style={styles.noDataText}>Tidak ada data untuk ditampilkan</Text>
        </View>
      );
    }

    const total = data.reduce((sum, item) => sum + (item.population || 0), 0);

    if (total === 0) {
      return (
        <View style={styles.responsiveLegendContainer}>
          <Text style={styles.noDataText}>Total data kosong</Text>
        </View>
      );
    }

    return (
      <View style={styles.responsiveLegendContainer}>
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.population / total) * 100).toFixed(1) : 0;

          return (
            <View key={index} style={styles.responsiveLegendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <View style={styles.legendTextContainer}>
                <Text style={styles.legendText} numberOfLines={1}>
                  {item.name || "Unknown"}
                </Text>
                <Text style={styles.legendValue}>
                  {item.population || 0} {t("general.hari")} ({percentage}%)
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString().split("T")[0];
      if (now !== currentDateStr) {
        setCurrentDateStr(now);
      }
    }, 60 * 1000); // Cek setiap 1 menit

    return () => clearInterval(interval);
  }, [currentDateStr]);

  useFocusEffect(
    useCallback(() => {
      const fetchAttendanceHistory = async () => {
        try {
          const userDataStr = await AsyncStorage.getItem("userData");
          const userData = JSON.parse(userDataStr);
          const userId = userData?.id_pengguna;

          if (!userId) return;

          const response = await fetch(`${API.HISTORY}/${userId}`);
          const result = await response.json();

          if (!result?.data) return;

          const hadirData = result.data.filter((item) => item.status_kehadiran === "Hadir");

          const todayEntry = result.data.find((item) => item.tanggal === today);

          if (todayEntry) {
            setTodayAttendance({
              jam_masuk: todayEntry.jam_masuk || null,
              jam_keluar: todayEntry.jam_keluar || null,
            });
          } else {
            setTodayAttendance({ jam_masuk: null, jam_keluar: null });
          }

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

          converted = converted.sort((a, b) => {
            const dateTimeA = new Date(`${a.date}T${a.time}`);
            const dateTimeB = new Date(`${b.date}T${b.time}`);
            return dateTimeB - dateTimeA;
          });

          setRecentAttendance(converted.slice(0, 3));

          const pieRes = await fetch(`${API.PIE_CHART}/${userId}`);
          const pieJson = await pieRes.json();

          // Transform data for react-native-chart-kit PieChart
          if (pieJson.labels && pieJson.data && Array.isArray(pieJson.labels) && Array.isArray(pieJson.data)) {
            const pieData = pieJson.labels
              .map((label, index) => {
                const translationKey = mapLabelToTranslationKey(label);
                const translatedName = t(translationKey);
                const population = pieJson.data[index] || 0;

                return {
                  name: translatedName,
                  population: population,
                  color: getColorByStatus(translationKey),
                  legendFontColor: "#333333",
                  legendFontSize: 12,
                };
              })
              .filter((item) => item.population > 0);

            setChartData(pieData);
          } else {
            console.log("Invalid pie chart data structure");
            setChartData([]);
          }

          const izinRes = await fetch(`${API.EXISTING_IZIN}/${userId}`);
          const izinJson = await izinRes.json();
          if (izinJson?.data) {
            const existingDates = izinJson.data.map((item) => item.tanggal);
            setDisabledDates(existingDates);
          }
        } catch (err) {
          console.log("Error fetching attendance history:", err);
          setChartData([]);
        }
      };

      fetchAttendanceHistory();
    }, [currentDateStr, t])
  );

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const dataString = await AsyncStorage.getItem("userData");
          if (dataString) {
            const data = JSON.parse(dataString);
            const [shift_mulai, shift_selesai] = (data.jam_shift || "").split(" - ");
              setUserData({
                id_pengguna: data.id_pengguna || null,
                nama_lengkap: data.nama_lengkap || "",
                alamat_lengkap: data.alamat_lengkap || "",
                shift_mulai: shift_mulai || "",
                shift_selesai: shift_selesai || "",
                foto_pengguna: data.foto_pengguna || "",
              });
          }
        } catch (e) {
          console.log("Failed to get userData:", e);
        }
      };

      getCurrentTimeString();
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

  useFocusEffect(
    useCallback(() => {
      const fetchAttendanceHistory = async () => {
        try {
          const dataString = await AsyncStorage.getItem("userData");
          let userId = null;
          if (dataString) {
            const data = JSON.parse(dataString);
            userId = data.id_pengguna;
          }
          if (!userId) return;

          const response = await fetch(`${API.HISTORY}/${userId}`);
          const result = await response.json();

          if (!result?.data) return;

          const todayEntry = result.data.find((item) => item.tanggal === today);
          
          if (todayEntry) {
            setTodayAttendance({
              jam_masuk: todayEntry.jam_masuk || null,
              jam_keluar: todayEntry.jam_keluar || null,
            });
          } else {
            setTodayAttendance({ jam_masuk: null, jam_keluar: null });
          }
          console.log("Attendance for today:", todayAttendance);

          // FETCH PIE CHART
          const pieRes = await fetch(`${API.PIE_CHART}/${userId}`);
          const pieJson = await pieRes.json();

          const getColorByStatus = (label) => {
            const normalizedLabel = label.toLowerCase();
            if (
              normalizedLabel.includes("alfa") ||
              normalizedLabel.includes("alpa")
            )
              return "#F44336";
            if (normalizedLabel.includes("izin")) return "#FFC107";
            if (normalizedLabel.includes("hadir")) return "#4CAF50";
            if (normalizedLabel.includes("sakit")) return "#42A5F5";
            return "#9E9E9E";
          };

          const pieData = pieJson.labels.map((label, index) => ({
            name: label,
            population: pieJson.data[index],
            color: getColorByStatus(label),
            legendFontColor: "#333",
            legendFontSize: 14,
          }));

          setChartData(pieData);
          console.log(pieData);
        } catch (err) {
          console.log("Error fetching attendance history:", err);
        }
      };

      fetchAttendanceHistory();
    }, [currentDateStr])
  );


  // Time ticker only (no user data here anymore)
  const getCurrentTimeString = () => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0"); // tambahkan padStart
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
      setLoadingTime(false);
    }, 1000);

    return () => clearInterval(interval);
  };

  const isTodayHoliday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay(); // 0 = Minggu, 6 = Sabtu
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isNationalHoliday = holidays.some((item) => {
      const start = new Date(item.tanggal_mulai);
      const end = new Date(item.tanggal_selesai);
      const current = new Date(today);
      return current >= start && current <= end;
    });
    return isNationalHoliday || isWeekend;
  }, [holidays, currentDateStr]);

  const isAfterShift = useMemo(() => {
    if (userData.shift_selesai) {
      const [endHour, endMinute] = userData.shift_selesai.split(":").map(Number);
      const now = new Date();
      const batasAkhir = new Date(now);
      batasAkhir.setHours(endHour, endMinute, 0, 0);
      return now >= batasAkhir;
    }
    return false;
  }, [userData.shift_selesai, currentTime]);

  const isAbsenDisabled = useMemo(() => {
    if (userData.shift_selesai) {
      
      if (todayAttendance.jam_masuk == null) {
        return isAfterShift;
      }
      const [endHour, endMinute] = userData.shift_selesai.split(":").map(Number);
      const now = new Date();
      const batasAbsen = new Date(now);
      batasAbsen.setHours(endHour + 1, endMinute, 0, 0); // shift_selesai + 1 jam
      return now >= batasAbsen;
    }
    return false;
  }, [userData.shift_selesai, todayAttendance.jam_masuk, currentDateStr]);

  


  const handleNavigation = (screenName) => {
    Animated.timing(animatedValue, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate(screenName);
    });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.blueBackground} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Enhanced Header Section */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
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
        </View>

        <Animated.View
          style={[
            styles.whiteContainer,
            { transform: [{ translateY: animatedValue }] },
          ]}
        >
          <View style={styles.greyLine} />

          {/* Time Section */}
          <View style={styles.timeSection}>
            <WithLoader loading={loadingTime}>
              <Text style={styles.time}>{currentTime}</Text>
              <Text style={styles.timeSubtitle}>
                {new Date(currentDateStr).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </WithLoader>
          </View>

          {/* Action Buttons Section */}
          <View style={styles.actionCard}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (isAbsenDisabled) && { opacity: 0.5 },
              ]}
              onPress={() => handleNavigation("CameraScreen")}
              disabled={isAbsenDisabled}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  styles.scanIconContainer
                ]}
              >
                <Ionicons name="scan" size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{t("general.absen")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowFormIzin(true)}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  styles.documentIconContainer,
                ]}
              >
                <Ionicons name="document-text-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{t("general.izin")}</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Attendance Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("home.todayInfo")}</Text>
              <View style={styles.cardTitleUnderline} />
            </View>
            <View style={styles.attendanceRow}>
              <View style={[styles.attendanceItem]}>
                <View style={styles.attendanceIconContainer}>
                  <Ionicons name="log-in-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.attendanceLabel}>{t("home.checkIn")}</Text>
                <Text style={styles.attendanceTime}>
                  {todayAttendance.jam_masuk
                    ? todayAttendance.jam_masuk.slice(0, 5)
                    : "-"}
                </Text>
              </View>

              <View style={styles.attendanceDivider} />

              <View style={styles.attendanceItem}>
                <View style={styles.attendanceIconContainer}>
                  <Ionicons name="log-out-outline" size={20} color="#F44336" />
                </View>
                <Text style={styles.attendanceLabel}>{t("home.checkOut")}</Text>
                <Text style={styles.attendanceTime}>
                  {todayAttendance.jam_keluar
                    ? todayAttendance.jam_keluar.slice(0, 5)
                    : "-"}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistics Card with side-by-side layout */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{t("home.statistik")}</Text>
                <TouchableOpacity
                  onPress={() => handleNavigation("History")}
                  style={styles.linkContainer}
                >
                  <Text style={styles.link}>{t("home.lihat")}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#2E7BE8" />
                </TouchableOpacity>
              </View>
              <View style={styles.cardTitleUnderline} />
            </View>

            {chartData.length > 0 ? (
              <View style={styles.chartContainer}>
                <View style={styles.chartSection}>
                  <PieChart
                    data={chartData}
                    width={getChartDimensions().width}
                    height={getChartDimensions().height}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    center={[10, 0]}
                    absolute={false}
                    hasLegend={false}
                  />
                </View>
                <View style={styles.legendSection}>
                  <ResponsiveLegend data={chartData} />
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="pie-chart-outline" size={48} color="#E0E0E0" />
                <Text style={styles.noDataText}>Belum ada data statistik</Text>
              </View>
            )}
          </View>

          {/* Calendar Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("home.calendar")}</Text>
              <View style={styles.cardTitleUnderline} />
            </View>
            <View style={styles.calendarContainer}>
              <CalendarWithHoliday
                holidays={holidays}
                onHolidaysChange={setHolidays}
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <FormizinPopup
        visible={showFormIzin}
        onClose={() => setShowFormIzin(false)}
        isAfterShift={isAfterShift}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#2E7BE8",
  },
  blueBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 32,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerTextContainer: {
    flex: 1,
  },
  welcome: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 4,
  },
  whiteContainer: {
    backgroundColor: "#fff",
    marginTop: -12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    minHeight: screenHeight,
  },
  greyLine: {
    height: 4,
    width: 40,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  timeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  time: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    letterSpacing: 1,
  },
  timeSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "500",
  },
  actionCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  scanIconContainer: {
    backgroundColor: "#2E7BE8",
  },
  documentIconContainer: {
    backgroundColor: "#FF9500",
  },
  actionLabel: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  cardTitleUnderline: {
    height: 3,
    width: 30,
    backgroundColor: "#2E7BE8",
    borderRadius: 2,
  },
  attendanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendanceItem: {
    alignItems: "center",
    flex: 1,
  },
  attendanceIconContainer: {
    marginBottom: 8,
  },
  attendanceLabel: {
    color: "#8E8E93",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
  },
  attendanceTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  attendanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
  },
  // Updated chart styles for side-by-side layout with proper spacing
  chartContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    minHeight: 180,
  },
  chartSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
  },
  legendSection: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  responsiveLegendContainer: {
    flex: 1,
  },
  responsiveLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "#F8F9FA",
    minHeight: 32,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    flexShrink: 0,
  },
  legendTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  legendText: {
    fontSize: 11,
    color: "#333",
    fontWeight: "600",
    marginBottom: 1,
    flexWrap: "wrap",
  },
  legendValue: {
    fontSize: 9,
    color: "#8E8E93",
    fontWeight: "500",
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  link: {
    fontSize: 14,
    color: "#2E7BE8",
    fontWeight: "600",
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  historyIconContainer: {
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkInIcon: {
    backgroundColor: "#4CAF50",
  },
  checkOutIcon: {
    backgroundColor: "#F44336",
  },
  historyContent: {
    flex: 1,
  },
  historyType: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 2,
  },
  historyDate: {
    color: "#8E8E93",
    fontSize: 13,
    fontWeight: "500",
  },
  historyTime: {
    fontWeight: "bold",
    fontSize: 15,
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
});
