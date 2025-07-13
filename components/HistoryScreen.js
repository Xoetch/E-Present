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
  ScrollView,
  Image,
  Linking
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // State management
  const [userId, setUserId] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedType, setSelectedType] = useState("All");
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempType, setTempType] = useState(selectedType);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Format time function
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "null") return "-";
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.slice(0,5);
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
    return timeStr;
  };

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const dataString = await AsyncStorage.getItem('userData');
        if (dataString) {
          const data = JSON.parse(dataString);
          setUserId(data.id_pengguna);
        }
      } catch (e) {
        console.log('Failed to get userData:', e);
      }
    };
    fetchUserId();
  }, []);

  // Fetch history data from API
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;
      try {
        const response = await fetch(`http://10.1.51.153:8080/present/getHistory/${userId}`);
        const result = await response.json();
        if (result) {
          setHistoryData(result.data);
        } else {
          setHistoryData([]);
        }
      } catch (e) {
        console.log('Failed to fetch history:', e);
        setHistoryData([]);
      }
    };
    fetchHistory();
  }, [userId]);

  // Process history data into attendance data
  useEffect(() => {
    const hadirData = Array.isArray(historyData)
      ? historyData.filter(item => item.status_kehadiran === "Hadir")
      : [];
  
    let converted = [];
    hadirData.forEach((item) => {
      if (item.jam_masuk) {
        converted.push({
          id: `${item.id}_masuk`,
          ...item,
          type: "Masuk Kerja",
          time: item.jam_masuk,
        });
      }
      if (item.jam_keluar) {
        converted.push({
          id: `${item.id}_pulang`,
          ...item,
          type: "Pulang Kerja",
          time: item.jam_keluar,
        });
      }
    });
  
    setAttendanceData(converted.reverse());
  }, [historyData]);

  // Apply filters to data
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

  // Apply filter when historyData changes
  useEffect(() => {
    applyFilter();
  }, [historyData]);

  // Get month/year label for filter display
  const getMonthYearLabel = () => {
    const isAllMonth = selectedMonth === "All";
    const isAllYear = selectedYear === "All";
    if (isAllMonth && isAllYear) return t("history.semuaWaktu");
    if (!isAllMonth && isAllYear) return `${months[parseInt(selectedMonth)]}`;
    if (isAllMonth && !isAllYear) return `${selectedYear}`;
    return `${months[parseInt(selectedMonth)]} ${selectedYear}`;
  };

  // Render each history item
  const renderItem = ({ item }) => {
    const statusColors = {
      "Hadir": "#4CAF50",
      "Izin": "#FFA000",
      "Tidak Masuk": "#F44336"
    };

    const statusIcons = {
      "Hadir": "checkmark",
      "Izin": "document-text",
      "Tidak Masuk": "close"
    };

    return (
      <TouchableOpacity 
        style={styles.itemContainer}
        onPress={() => {
          setSelectedDetailItem(item);
          setDetailModalVisible(true);
        }}
      >
        <View
          style={[
            styles.circleIcon,
            { backgroundColor: statusColors[item.status_kehadiran] || "#4CAF50" },
          ]}
        >
          <Ionicons 
            name={statusIcons[item.status_kehadiran] || "time"} 
            size={18} 
            color="#fff" 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.typeText}>
            {item.status_kehadiran === "Hadir" ? 
              `${formatTime(item.jam_masuk)} - ${formatTime(item.jam_keluar)}` : 
              item.status_kehadiran}
          </Text>
          <Text style={styles.dateText}>{item.tanggal}</Text>
          <Text style={styles.dateText}>Shift: {item.shift_kerja || '-'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render the detail modal
  const renderDetailModal = () => {
    if (!selectedDetailItem) return null;

    const handleOpenImage = (imageUrl) => {
      if (imageUrl && !imageUrl.includes("null")) {
        Linking.openURL(imageUrl).catch(err => console.error("Failed to open image:", err));
      }
    };

    const statusColors = {
      "Hadir": "#4CAF50",
      "Izin": "#FFA000",
      "Tidak Masuk": "#F44336"
    };

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={detailStyles.modalOverlay}>
          <View style={detailStyles.modalContainer}>
            {/* Header */}
            <View style={detailStyles.modalHeader}>
              <Text style={detailStyles.modalTitle}>Detail Kehadiran</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView style={detailStyles.modalContent}>
              <View style={detailStyles.cardHeader}>
                <Ionicons name="calendar-outline" size={24} color="#2E7BE8" />
                <Text style={detailStyles.cardHeaderText}>{selectedDetailItem.tanggal}</Text>
                <View style={[
                  detailStyles.statusBadge,
                  { 
                    backgroundColor: statusColors[selectedDetailItem.status_kehadiran] + "20" || "#E8F5E9"
                  }
                ]}>
                  <Text style={[
                    detailStyles.statusText,
                    { 
                      color: statusColors[selectedDetailItem.status_kehadiran] || "#4CAF50"
                    }
                  ]}>
                    {selectedDetailItem.status_kehadiran}
                  </Text>
                </View>
              </View>

              <View style={detailStyles.detailRow}>
                <Text style={detailStyles.detailLabel}>Shift Kerja:</Text>
                <Text style={detailStyles.detailValue}>{selectedDetailItem.shift_kerja || "-"}</Text>
              </View>

              {selectedDetailItem.status_kehadiran === "Hadir" && (
                <>
                  <View style={detailStyles.timeSection}>
                    <View style={detailStyles.timeCard}>
                      <Ionicons name="time-outline" size={20} color="#4CAF50" />
                      <Text style={detailStyles.timeLabel}>Jam Masuk</Text>
                      <Text style={detailStyles.timeValue}>{formatTime(selectedDetailItem.jam_masuk)}</Text>
                    </View>

                    <View style={detailStyles.timeCard}>
                      <Ionicons name="time-outline" size={20} color="#F44336" />
                      <Text style={detailStyles.timeLabel}>Jam Pulang</Text>
                      <Text style={detailStyles.timeValue}>{formatTime(selectedDetailItem.jam_keluar)}</Text>
                    </View>
                  </View>

                  <View style={detailStyles.photoSection}>
                    <Text style={detailStyles.sectionTitle}>Bukti Kehadiran</Text>
                    
                    {selectedDetailItem.bukti_kehadiran && !selectedDetailItem.bukti_kehadiran.includes("null") && (
                      <TouchableOpacity onPress={() => handleOpenImage(selectedDetailItem.bukti_kehadiran)}>
                        <View style={detailStyles.photoContainer}>
                          <Image 
                            source={{ uri: selectedDetailItem.bukti_kehadiran }} 
                            style={detailStyles.photo} 
                            resizeMode="cover"
                          />
                          <Text style={detailStyles.photoCaption}>Foto Masuk</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {selectedDetailItem.bukti_kehadiran2 && !selectedDetailItem.bukti_kehadiran2.includes("null") && (
                      <TouchableOpacity onPress={() => handleOpenImage(selectedDetailItem.bukti_kehadiran2)}>
                        <View style={detailStyles.photoContainer}>
                          <Image 
                            source={{ uri: selectedDetailItem.bukti_kehadiran2 }} 
                            style={detailStyles.photo} 
                            resizeMode="cover"
                          />
                          <Text style={detailStyles.photoCaption}>Foto Pulang</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {selectedDetailItem.status_kehadiran === "Izin" && (
                <>
                  <View style={detailStyles.infoCard}>
                    <Ionicons name="document-text-outline" size={24} color="#FFA000" />
                    <Text style={detailStyles.infoText}>{selectedDetailItem.keterangan || "Tidak ada keterangan"}</Text>
                  </View>

                  {selectedDetailItem.bukti_kehadiran && !selectedDetailItem.bukti_kehadiran.includes("null") && (
                    <View style={detailStyles.photoSection}>
                      <Text style={detailStyles.sectionTitle}>Bukti Izin</Text>
                      <TouchableOpacity onPress={() => handleOpenImage(selectedDetailItem.bukti_kehadiran)}>
                        <View style={detailStyles.photoContainer}>
                          <Image 
                            source={{ uri: selectedDetailItem.bukti_kehadiran }} 
                            style={detailStyles.photo} 
                            resizeMode="cover"
                          />
                          <Text style={detailStyles.photoCaption}>Surat Izin</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {selectedDetailItem.status_kehadiran === "Tidak Masuk" && (
                <View style={detailStyles.infoCard}>
                  <Ionicons name="warning-outline" size={24} color="#F44336" />
                  <Text style={detailStyles.infoText}>Tidak hadir tanpa keterangan</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

      {/* Filter Modal */}
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
              <Picker.Item label={t("general.masuk")} value="Hadir" />
              <Picker.Item label={t("history.izin")} value="Izin" />
              <Picker.Item label={t("history.tidakMasuk")} value="Tidak Masuk" />
            </Picker>

            <TouchableOpacity style={styles.modalButton} onPress={applyFilter}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                {t("history.btn")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History List */}
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

      {/* Detail Modal */}
      {renderDetailModal()}
    </View>
  );
}

// Detail Modal Styles
const detailStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  cardHeaderText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 5,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  photoSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  photoCaption: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
});

// Main Styles
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