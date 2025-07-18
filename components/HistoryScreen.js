import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API from "../utils/ApiConfig";

// Constants - moved outside component to prevent recreation
const FILTER_ALL = "All";
const YEAR_RANGE_START = 2020;
const YEAR_RANGE_LENGTH = 10;

// Status configurations
const STATUS_CONFIG = {
  Hadir: { icon: "checkmark-circle", color: "#4CAF50" },
  Izin: { icon: "alert-circle", color: "#FFC107" },
  Sakit: { icon: "medkit", color: "#03A9F4" },
  Alpa: { icon: "close-circle", color: "#F44336" },
  Cuti: { icon: "briefcase", color: "#9C27B0" },
  Lainnya: { icon: "help-circle", color: "#9E9E9E" },
};

// Custom hook for user data
const useUserData = () => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        setLoading(true);
        const dataString = await AsyncStorage.getItem("userData");
        if (dataString) {
          const data = JSON.parse(dataString);
          setUserId(data.id_pengguna);
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUserId();
  }, []);

  return { userId, loading, error };
};

// Custom hook for history data
const useHistoryData = (userId) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API.HISTORY}/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Safely handle the response structure
      const data = result?.data || result || [];
      setHistoryData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching history:", e);
      setError("Failed to load history data");
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  return { historyData, loading, error, refetch: fetchHistory };
};

// Utility functions
const formatTime = (timeStr) => {
  if (!timeStr) return "-";

  // Already in correct format
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;

  // Remove seconds
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.slice(0, 5);

  // Handle AM/PM format
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

const getBaseStatus = (status) => {
  if (!status) return "Lainnya";

  if (status.startsWith("Izin")) return "Izin";
  if (status === "Hadir") return "Hadir";
  if (status === "Sakit") return "Sakit";
  if (status === "Alpa") return "Alpa";
  if (status === "Cuti") return "Cuti";

  return "Lainnya";
};

const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
};

export default function HistoryScreen() {
  const currentDate = new Date();
  const { t } = useTranslation();

  // Get user data
  const { userId, loading: userLoading, error: userError } = useUserData();

  // Get history data
  const { historyData, loading: historyLoading, error: historyError, refetch } = useHistoryData(userId);

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedType, setSelectedType] = useState(FILTER_ALL);

  // Temporary filter states for modal
  const [tempMonth, setTempMonth] = useState(selectedMonth);
  const [tempYear, setTempYear] = useState(selectedYear);
  const [tempType, setTempType] = useState(selectedType);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoType, setSelectedPhotoType] = useState(null);

  // Localized months
  const months = useMemo(
    () => [
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
    ],
    [t]
  );

  // Memoized filtered data
  const filteredData = useMemo(() => {
    if (!Array.isArray(historyData) || historyData.length === 0) {
      return [];
    }

    return historyData.filter((item) => {
      // Validate item structure
      if (!item || typeof item !== "object") {
        return false;
      }

      // Validate and parse date
      if (!isValidDate(item.tanggal)) {
        return false;
      }

      const itemDate = new Date(item.tanggal);

      // Apply filters
      const matchMonth = selectedMonth === FILTER_ALL || itemDate.getMonth() === parseInt(selectedMonth);

      const matchYear = selectedYear === FILTER_ALL || itemDate.getFullYear() === parseInt(selectedYear);

      const matchType = selectedType === FILTER_ALL || item.status_kehadiran === selectedType;

      return matchMonth && matchYear && matchType;
    });
  }, [historyData, selectedMonth, selectedYear, selectedType]);

  // Get month/year label
  const getMonthYearLabel = useCallback(() => {
    const isAllMonth = selectedMonth === FILTER_ALL;
    const isAllYear = selectedYear === FILTER_ALL;

    if (isAllMonth && isAllYear) return t("history.semuaWaktu");
    if (!isAllMonth && isAllYear) return months[parseInt(selectedMonth)];
    if (isAllMonth && !isAllYear) return selectedYear;

    return `${months[parseInt(selectedMonth)]} ${selectedYear}`;
  }, [selectedMonth, selectedYear, months, t]);

  // Apply filter function
  const applyFilter = useCallback(() => {
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setSelectedType(tempType);
    setModalVisible(false);
  }, [tempMonth, tempYear, tempType]);

  // Handle item press
  const handleItemPress = useCallback((item) => {
    setSelectedItem(item);
    setSelectedPhotoType(null);
    setPhotoModalVisible(true);
  }, []);

  // Open filter modal
  const openFilterModal = useCallback(() => {
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setTempType(selectedType);
    setModalVisible(true);
  }, [selectedMonth, selectedYear, selectedType]);

  // Render item component
  const renderItem = useCallback(
    ({ item }) => {
      if (!item || !item.status_kehadiran) return null;

      const baseStatus = getBaseStatus(item.status_kehadiran);
      const { icon, color } = STATUS_CONFIG[baseStatus];

      return (
        <TouchableOpacity onPress={() => handleItemPress(item)} style={styles.itemContainer}>
          <View style={[styles.circleIcon, { backgroundColor: color }]}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.typeText}>{item.status_kehadiran}</Text>
            <Text style={styles.dateText}>{item.tanggal}</Text>
            <Text style={[styles.timeText, { color }]}>
              {formatTime(item.jam_masuk)} | {formatTime(item.jam_keluar)}
            </Text>
            <Text style={styles.dateText}>Shift: {item.shift_kerja || "-"}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleItemPress]
  );

  // Loading state
  if (userLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2E7BE8" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  // Error state
  if (userError || historyError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{userError || historyError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.filterCard}>
          <Ionicons name="calendar-outline" size={20} color="#2E7BE8" />
          <Text style={styles.filterText}>{getMonthYearLabel()}</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
          <Ionicons name="options-outline" size={20} color="#2E7BE8" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter</Text>

            <Text style={styles.modalSubtitle}>{t("history.bulan")}</Text>
            <Picker selectedValue={tempMonth} onValueChange={setTempMonth}>
              <Picker.Item label={t("general.semua")} value={FILTER_ALL} />
              {months.map((month, index) => (
                <Picker.Item key={index} label={month} value={index.toString()} />
              ))}
            </Picker>

            <Text style={styles.modalSubtitle}>{t("history.tahun")}</Text>
            <Picker selectedValue={tempYear} onValueChange={setTempYear}>
              <Picker.Item label={t("general.semua")} value={FILTER_ALL} />
              {Array.from({ length: YEAR_RANGE_LENGTH }, (_, i) => {
                const year = YEAR_RANGE_START + i;
                return <Picker.Item key={year} label={year.toString()} value={year.toString()} />;
              })}
            </Picker>

            <Text style={styles.modalSubtitle}>{t("history.jenis")}</Text>
            <Picker selectedValue={tempType} onValueChange={setTempType}>
              <Picker.Item label={t("general.semua")} value={FILTER_ALL} />
              <Picker.Item label={t("general.masuk")} value="Hadir" />
              <Picker.Item label={t("general.pulang")} value="Izin" />
              <Picker.Item label={t("history.tidakMasuk")} value="Alfa" />
            </Picker>

            <TouchableOpacity style={styles.modalButton} onPress={applyFilter}>
              <Text style={styles.modalButtonText}>{t("history.btn")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Modal */}
      <Modal visible={photoModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.photoModalContent]}>
            <Text style={styles.modalTitle}>Detail Kehadiran</Text>

            <View style={styles.photoButtonsContainer}>
              {/* Show attendance proof buttons for non-leave statuses */}
              {!selectedItem?.status_kehadiran?.startsWith("Izin") && (
                <>
                  {selectedItem?.bukti_kehadiran && (
                    <TouchableOpacity onPress={() => setSelectedPhotoType("masuk")} style={styles.photoButton}>
                      <Text style={styles.photoButtonText}>Bukti Masuk</Text>
                    </TouchableOpacity>
                  )}
                  {selectedItem?.bukti_kehadiran2 && (
                    <TouchableOpacity onPress={() => setSelectedPhotoType("pulang")} style={styles.photoButton}>
                      <Text style={styles.photoButtonText}>Bukti Pulang</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Show leave proof for leave statuses */}
              {selectedItem?.status_kehadiran?.startsWith("Izin") && selectedItem?.bukti_izin && (
                <TouchableOpacity
                  onPress={() => setSelectedPhotoType("izin")}
                  style={[styles.photoButton, styles.leaveButton]}>
                  <Text style={styles.leaveButtonText}>Bukti Izin</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Display selected photo */}
            {selectedPhotoType === "masuk" && selectedItem?.bukti_kehadiran && (
              <Image source={{ uri: selectedItem.bukti_kehadiran }} style={styles.photo} resizeMode="contain" />
            )}

            {selectedPhotoType === "pulang" && selectedItem?.bukti_kehadiran2 && (
              <Image source={{ uri: selectedItem.bukti_kehadiran2 }} style={styles.photo} resizeMode="contain" />
            )}

            {selectedPhotoType === "izin" && selectedItem?.bukti_izin && (
              <Image source={{ uri: selectedItem.bukti_izin }} style={styles.photo} resizeMode="contain" />
            )}

            <TouchableOpacity style={styles.modalButton} onPress={() => setPhotoModalVisible(false)}>
              <Text style={styles.modalButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Content */}
      <View style={styles.contentContainer}>
        <View style={styles.greyLine} />
        <Text style={styles.title}>{t("history.title")}</Text>

        {historyLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7BE8" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item, idx) => (item?.id ? item.id.toString() : `item-${idx}`)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>{t("history.blank")}</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E7BE8",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginVertical: 10,
  },
  retryButton: {
    backgroundColor: "#2E7BE8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 80,
  },
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
  textContainer: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  dateText: {
    fontSize: 13,
    color: "#777",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 50,
  },
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
  photoModalContent: {
    maxHeight: "80%",
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
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  photoButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  photoButton: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  photoButtonText: {
    color: "#2E7BE8",
    fontWeight: "bold",
  },
  leaveButton: {
    backgroundColor: "#FFF3E0",
  },
  leaveButtonText: {
    color: "#F39C12",
    fontWeight: "bold",
  },
  greyLine: {
    height: 6,
    width: 80,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 8,
  },
  photo: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
  },
});
