import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Dummy data absensi
// const attendanceData = [
//   { id: "1", type: "Masuk Kerja", time: "09:00 AM", date: "2024-01-14" },
//   { id: "2", type: "Pulang Kerja", time: "05:00 PM", date: "2024-02-14" },
//   { id: "3", type: "Masuk Kerja", time: "08:30 AM", date: "2024-03-10" },
//   { id: "4", type: "Pulang Kerja", time: "05:15 PM", date: "2024-03-10" },
//   { id: "5", type: "Masuk Kerja", time: "09:05 AM", date: "2024-04-12" },
//   { id: "6", type: "Pulang Kerja", time: "05:02 PM", date: "2024-04-12" },
// ];

const months = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function HistoryScreen() {
  const currentDate = new Date();
  const { t, i18n } = useTranslation();

  const months = [
    t("months.january"),
    t("months.february"),
    t("months.march"),
    t("months.april"),
    t("months.may"),
    t("months.june"),
    t("months.july"),
    t("months.august"),
    t("months.september"),
    t("months.october"),
    t("months.november"),
    t("months.december"),
  ];

  // 1. State untuk id_pengguna
  const [userId, setUserId] = useState(null);

  // 2. Dummy data absensi jadi useState
  const [attendanceData, setAttendanceData] = useState([
    { id: "1", type: "Masuk Kerja", time: "09:00 AM", date: "2024-01-14" },
    { id: "2", type: "Pulang Kerja", time: "05:00 PM", date: "2024-02-14" },
    { id: "3", type: "Masuk Kerja", time: "08:30 AM", date: "2024-03-10" },
    { id: "4", type: "Pulang Kerja", time: "05:15 PM", date: "2024-03-10" },
    { id: "5", type: "Masuk Kerja", time: "09:05 AM", date: "2024-04-12" },
    { id: "6", type: "Pulang Kerja", time: "05:02 PM", date: "2024-04-12" },
  ]);

  // 5. State untuk hasil API
  const [historyData, setHistoryData] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedType, setSelectedType] = useState("All");

  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempType, setTempType] = useState(selectedType);

  const [modalVisible, setModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    // Jika sudah dalam format HH:mm, langsung return
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    // Jika format jam:menit:detik, ambil jam dan menit
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.slice(0,5);
    // Jika format 09:00 AM atau 05:00 PM
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const minute = match[2];
      const ampm = match[3];
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
      }
      return `${hour.toString().padStart(2, "0")}:${minute}`;
    }
    return timeStr; // fallback
  };

  // 1. Ambil id_pengguna dari AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const dataString = await AsyncStorage.getItem('userData');
        if (dataString) {
          const data = JSON.parse(dataString);
          setUserId(data.id_pengguna);
        }
      } catch (e) {
        console.log('Gagal mengambil userData:', e);
      }
    };
    fetchUserId();
  }, []);

  // 3 & 4. Fetch data history dari API jika userId sudah ada
  useEffect(() => {
    console.log('Fetching history for userId:', userId);
    const fetchHistory = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`http://10.1.51.153:8080/present/getHistory/${userId}`);
        const result = await response.json();
        // 6. Struktur data: tanggal, jam_masuk, jam_keluar, shift_kerja, status_kehadiran, bukti_kehadiran
        if (result) {
          setHistoryData(result.data);
        } else {
          setHistoryData([]);
        }
      } catch (e) {
        console.log('Gagal mengambil history:', e);
        setHistoryData([]);
      }
    };
    fetchHistory();
  }, [userId]);

  useEffect(() => {
    // 1. Filter hanya status_kehadiran "Hadir"
    const hadirData = Array.isArray(historyData)
      ? historyData.filter(item => item.status_kehadiran === "Hadir")
      : [];
  
    // 2 & 3. Konversi setiap data menjadi 2 data (Masuk Kerja & Pulang Kerja)
    let converted = [];
    hadirData.forEach((item, idx) => {
      // Masuk Kerja
      if (item.jam_masuk) {
        converted.push({
          id: `${item.id}_masuk`,
          type: "Masuk Kerja",
          time: item.jam_masuk,
          date: item.tanggal,
        });
      }
      // Pulang Kerja
      if (item.jam_keluar) {
        converted.push({
          id: `${item.id}_pulang`,
          type: "Pulang Kerja",
          time: item.jam_keluar,
          date: item.tanggal,
        });
      }
    });
  
    // 4. Urutkan: data pertama dari API jadi id terakhir setelah dikonversi, dan sebaliknya
    converted = converted.reverse();
  
    setAttendanceData(converted);
  }, [historyData]);

  // Fungsi untuk filter data berdasarkan filter aktif (gunakan historyData)
  const applyFilter = () => {
    const filtered = historyData.filter((item) => {
      const itemDate = new Date(item.tanggal);
      const matchMonth = tempMonth === "All" || itemDate.getMonth() === parseInt(tempMonth);
      const matchYear = tempYear === "All" || itemDate.getFullYear() === parseInt(tempYear);
      const matchType = tempType === "All" || item.status_kehadiran === tempType;
      return matchMonth && matchYear && matchType;
    });

    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setSelectedType(tempType);
    setFilteredData(filtered);
    setModalVisible(false);
  };

  // Saat pertama kali load dan setiap historyData berubah
  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyData]);

  const getMonthYearLabel = () => {
    const isAllMonth = selectedMonth === "All";
    const isAllYear = selectedYear === "All";
    if (isAllMonth && isAllYear) return t("history.semuaWaktu");
    if (!isAllMonth && isAllYear) return `${months[parseInt(selectedMonth)]}`;
    if (isAllMonth && !isAllYear) return `${selectedYear}`;
    return `${months[parseInt(selectedMonth)]} ${selectedYear}`;
  };

  // Render item untuk data dari API
  const renderItem = ({ item }) => {
    const isMasuk = item.status_kehadiran === "Masuk Kerja";
    return (
      <View style={styles.itemContainer}>
        <View
          style={[
            styles.circleIcon,
            { backgroundColor: isMasuk ? "#4CAF50" : "#F44336" },
          ]}
        >
          <Ionicons name="time" size={18} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.typeText}>{item.status_kehadiran}</Text>
          <Text style={styles.dateText}>{item.tanggal}</Text>
          <Text style={[styles.timeText, { color: isMasuk ? "#4CAF50" : "#F44336" }]}>
          {formatTime(item.jam_masuk)} | {formatTime(item.jam_keluar)}        </Text>
        <Text style={styles.dateText}>Shift: {item.shift_kerja}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.filterCard}>
          <Ionicons name="calendar-outline" size={20} color="#2E7BE8" />
          <Text style={styles.filterText}>{getMonthYearLabel()}</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setTempMonth(selectedMonth);
            setTempYear(selectedYear);
            setTempType(selectedType);
            setModalVisible(true);
          }}
        >
          <Ionicons name="options-outline" size={20} color="#2E7BE8" />
        </TouchableOpacity>
      </View>

      {/* Modal Filter */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter</Text>

            <Text style={styles.modalSubtitle}>{t("history.bulan")}</Text>
            <Picker
              selectedValue={tempMonth}
              onValueChange={(itemValue) => setTempMonth(itemValue)}
            >
              <Picker.Item label={t("general.semua")} value="All" />
              {months.map((month, index) => (
                <Picker.Item
                  key={index}
                  label={month}
                  value={index.toString()}
                />
              ))}
            </Picker>

            <Text style={styles.modalSubtitle}>{t("history.tahun")}</Text>
            <Picker
              selectedValue={tempYear}
              onValueChange={(itemValue) => setTempYear(itemValue)}
            >
              <Picker.Item label={t("general.semua")} value="All" />
              {Array.from({ length: 10 }, (_, i) => {
                const year = 2020 + i;
                return (
                  <Picker.Item
                    key={year}
                    label={year.toString()}
                    value={year.toString()}
                  />
                );
              })}
            </Picker>

            <Text style={styles.modalSubtitle}>{t("history.jenis")}</Text>
            <Picker
              selectedValue={tempType}
              onValueChange={(itemValue) => setTempType(itemValue)}
            >
              <Picker.Item label={t("general.semua")} value="All" />
              <Picker.Item
                label={t("general.masuk")}
                value="Masuk Kerja"
              />
              <Picker.Item
                label={t("general.pulang")}
                value="Pulang Kerja"
              />
              <Picker.Item
                label={t("history.tidakMasuk")}
                value="Tidak Masuk"
              />
            </Picker>

            <TouchableOpacity style={styles.modalButton} onPress={applyFilter}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {t("history.btn")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* List */}
      <View style={styles.contentContainer}>
        <View style={styles.greyLine} />
        <Text style={styles.title}>{t("history.title")}</Text>
        <FlatList
          data={filteredData}
          keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{t("history.blank")}</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2E7BE8" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#2E7BE8",
    paddingBottom: 20,
  },
  filterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 9,
  },
  filterText: {
    color: "#2E7BE8",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6B7280",
    alignSelf: "center",
    marginVertical: 16,
  },
  listContent: { paddingBottom: 80 },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  circleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  typeText: { fontSize: 16, fontWeight: "bold", color: "#007AFF" },
  dateText: { fontSize: 13, color: "#777" },
  timeText: { fontSize: 15, fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 50 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    marginHorizontal: 30,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 4,
  },
  modalButton: {
    backgroundColor: "#2E7BE8",
    marginTop: 16,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  greyLine: {
    height: 6,
    width: 80,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
});
