// HomeScreen.js

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
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
import FormizinPopup from "./FormizinScreen"; // import FormizinPopup (modal)
import CalendarWithHoliday from "./Calendar";
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

export default function HomeScreen({ navigation }) {
  const chartData = [
    {
      name: "Masuk",
      population: 45,
      color: "#2E7BE8",
      legendFontColor: "#444",
      legendFontSize: 12,
    },
    {
      name: "Izin",
      population: 18,
      color: "#FEC107",
      legendFontColor: "#444",
      legendFontSize: 12,
    },
    {
      name: "Alfa",
      population: 36,
      color: "#F44336",
      legendFontColor: "#444",
      legendFontSize: 12,
    },
  ];

  const [currentTime, setCurrentTime] = useState("");
  const [showFormIzin, setShowFormIzin] = useState(false);
  const animatedValue = useRef(new Animated.Value(screenHeight)).current;
  const isInitialMount = useRef(true);

  // Handle navigation with animation
  const handleNavigation = (screenName) => {
    // Animate down before navigation
    Animated.timing(animatedValue, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Navigate after animation completes
      navigation.navigate(screenName);
    });
  };

  // Handle focus/blur events for screen transitions
  useFocusEffect(
    useCallback(() => {
      // Screen is focused - animate up
      if (isInitialMount.current) {
        // Initial mount - delay slightly for better UX
        setTimeout(() => {
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }, 100);
        isInitialMount.current = false;
      } else {
        // Returning to screen - animate up immediately
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }

      return () => {
        // Screen is blurred - animate down
        Animated.timing(animatedValue, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };
    }, [animatedValue])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const suffix = hours >= 12 ? "PM" : "AM";
      const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
      setCurrentTime(`${formattedHours}:${minutes} ${suffix}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.wrapper}>
      <View style={styles.blueBackground} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{
              uri: "https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg",
            }}
            style={styles.profileImage}
          />
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Selamat datang di E-Present</Text>
            <Text style={styles.userName}>Kaiser Wilhelm Althafazu</Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.whiteContainer,
            { transform: [{ translateY: animatedValue }] },
          ]}
        >
          <View style={styles.greyLine} />
          <Text style={styles.time}>{currentTime}</Text>

          <View style={styles.actionCard}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleNavigation("CameraScreen")}
            >
              <Ionicons name="scan" size={24} color="#2E7BE8" />
              <Text style={styles.actionLabel}>Absen</Text>
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
              <Text style={styles.actionLabel}>Izin</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Statistik</Text>
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
              <Text style={styles.cardTitle}>Riwayat Absensi</Text>
              <TouchableOpacity onPress={() => handleNavigation("Riwayat")}>
                <Text style={styles.link}>Lihat Selengkapnya ›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kalender</Text>
            <Text style={styles.calendarPlaceholder}>
              <CalendarWithHoliday />
            </Text>
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
    marginVertical: 8,
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
  calendarPlaceholder: {
    textAlign: "center",
    color: "#aaa",
    paddingVertical: 24,
  },
});