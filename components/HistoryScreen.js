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

// Dummy data absensi
const attendanceData = [
  { id: "1", type: "Masuk Kerja", time: "09:00 AM", date: "2024-01-14" },
  { id: "2", type: "Pulang Kerja", time: "05:00 PM", date: "2024-02-14" },
  { id: "3", type: "Masuk Kerja", time: "08:30 AM", date: "2024-03-10" },
  { id: "4", type: "Pulang Kerja", time: "05:15 PM", date: "2024-03-10" },
  { id: "5", type: "Masuk Kerja", time: "09:05 AM", date: "2024-04-12" },
  { id: "6", type: "Pulang Kerja", time: "05:02 PM", date: "2024-04-12" },
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

  // Filter aktif
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth().toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString()
  );
  const [selectedType, setSelectedType] = useState("All");

  // Filter sementara (saat modal terbuka)
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempType, setTempType] = useState(selectedType);

  const [modalVisible, setModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  // Fungsi untuk filter data berdasarkan filter aktif
  const applyFilter = () => {
    const filtered = attendanceData.filter((item) => {
      const itemDate = new Date(item.date);
      const matchMonth =
        tempMonth === "All" || itemDate.getMonth() === parseInt(tempMonth);
      const matchYear =
        tempYear === "All" || itemDate.getFullYear() === parseInt(tempYear);
      const matchType = tempType === "All" || item.type === tempType;
      return matchMonth && matchYear && matchType;
    });

    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setSelectedType(tempType);
    setFilteredData(filtered);
    setModalVisible(false);
  };

  // Saat pertama kali load
  useEffect(() => {
    applyFilter();
  }, []);

  const getMonthYearLabel = () => {
    const isAllMonth = selectedMonth === "All";
    const isAllYear = selectedYear === "All";
    if (isAllMonth && isAllYear) return t("history.semuaWaktu");
    if (!isAllMonth && isAllYear) return `${months[parseInt(selectedMonth)]}`;
    if (isAllMonth && !isAllYear) return `${selectedYear}`;
    return `${months[parseInt(selectedMonth)]} ${selectedYear}`;
  };

  const renderItem = ({ item }) => {
    const isMasuk = item.type === "Masuk Kerja";
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
          <Text style={styles.typeText}>{item.type}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Text
          style={[styles.timeText, { color: isMasuk ? "#4CAF50" : "#F44336" }]}
        >
          {item.time}
        </Text>
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
          keyExtractor={(item) => item.id}
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
