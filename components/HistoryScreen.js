import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../utils/ApiConfig";
const { width } = Dimensions.get("window");

// Constants - moved outside component to prevent recreation
const FILTER_ALL = "All";
const YEAR_RANGE_START = 2020;
const YEAR_RANGE_LENGTH = 10;

// Enhanced status configurations with gradients
const STATUS_CONFIG = {
  Hadir: {
    icon: "checkmark-circle",
    colors: ["#4CAF50", "#66BB6A"],
    lightColor: "#E8F5E8",
    textColor: "#2E7D32",
  },
  Izin: {
    icon: "briefcase",
    colors: ["#FFC107", "#FFD54F"],
    lightColor: "#FFF8E1",
    textColor: "#F57F17",
  },
  Alpa: {
    icon: "close-circle",
    colors: ["#F44336", "#EF5350"],
    lightColor: "#FFEBEE",
    textColor: "#C62828",
  },
  Terlambat: {
   icon: "close-circle",
    colors: ["#F44336", "#EF5350"],
    lightColor: "#FFEBEE",
    textColor: "#C62828",
  },
  Lainnya: {
   icon: "close-circle",
    colors: ["#F44336", "#EF5350"],
    lightColor: "#FFEBEE",
    textColor: "#C62828",
  },
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
  return timeStr;
};

const getBaseStatus = (status) => {
  if (!status) return "Lainnya";
  if (status.startsWith("Izin")) return "Izin";
  if (status === "Hadir") return "Hadir";
  if (status === "Alpa") return "Alpa";

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

  // Render item component with enhanced design
  const renderItem = useCallback(
    ({ item }) => {
      if (!item || !item.status_kehadiran) return null;

      const baseStatus = getBaseStatus(item.status_kehadiran);
      const { icon, colors, lightColor, textColor } = STATUS_CONFIG[baseStatus];

      return (
        <TouchableOpacity onPress={() => handleItemPress(item)} style={styles.itemContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: lightColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors[0] }]}>
              <Ionicons name={icon} size={24} color="#fff" />
            </View>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.headerRow}>
              <Text style={[styles.statusText, { color: textColor }]}>{item.status_kehadiran}</Text>
              <View style={[styles.statusBadge, { backgroundColor: lightColor }]}>
                <Text style={[styles.badgeText, { color: textColor }]}>{item.shift_kerja}</Text>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
              <Text style={styles.dateText}>{item.tanggal}</Text>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="log-in-outline" size={14} color="#34C759" />
                <Text style={styles.timeLabel}>Masuk</Text>
                <Text style={[styles.timeValue, { color: "#34C759" }]}>{formatTime(item.jam_masuk)}</Text>
              </View>

              <View style={styles.timeSeparator} />

              <View style={styles.timeItem}>
                <Ionicons name="log-out-outline" size={14} color="#FF3B30" />
                <Text style={styles.timeLabel}>Keluar</Text>
                <Text style={[styles.timeValue, { color: "#FF3B30" }]}>{formatTime(item.jam_keluar)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
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
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t("result.desc2")}</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (userError || historyError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          </View>
          <Text style={styles.errorTitle}>{t("result.desc3")}</Text>
          <Text style={styles.errorText}>{userError || historyError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>{t("general.repeat")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>{t("history.title")}</Text>
            <Text style={styles.headerSubtitle}>{t("history.subtitle")}</Text>
          </View>

          <View style={styles.filterSection}>
            <TouchableOpacity style={styles.filterCard} onPress={openFilterModal}>
              <Ionicons name="calendar-outline" size={18} color="#007AFF" />
              <Text style={styles.filterText}>{getMonthYearLabel()}</Text>
              <Ionicons name="chevron-down" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Enhanced Filter Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter History</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>{t("history.bulan")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={tempMonth} onValueChange={setTempMonth} style={styles.picker}>
                    <Picker.Item label={t("general.semua")} value={FILTER_ALL} />
                    {months.map((month, index) => (
                      <Picker.Item key={index} label={month} value={index.toString()} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>{t("history.tahun")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={tempYear} onValueChange={setTempYear} style={styles.picker}>
                    <Picker.Item label={t("general.semua")} value={FILTER_ALL} />
                    {Array.from({ length: YEAR_RANGE_LENGTH }, (_, i) => {
                      const year = YEAR_RANGE_START + i;
                      return <Picker.Item key={year} label={year.toString()} value={year.toString()} />;
                    })}
                  </Picker>
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>{t("history.jenis")}</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={tempType} onValueChange={setTempType} style={styles.picker}>
                    <Picker.Item label={t("general.semua")} value={FILTER_ALL} />
                    <Picker.Item label={t("general.hadir")} value="Hadir" />
                    <Picker.Item label={t("general.izin")} value="Izin" />
                    <Picker.Item label={t("general.alfa")} value="Alpa" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
                <Text style={styles.applyButtonText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Photo Modal */}
      <Modal visible={photoModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.photoModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("history.detail")}</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.photoModalContent} showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <View style={styles.detailsCard}>
                  <Text style={styles.detailStatus}>{selectedItem.status_kehadiran}</Text>
                  <Text style={styles.detailDate}>{selectedItem.tanggal}</Text>
                </View>
              )}

              <View style={styles.photoButtonsGrid}>
                {/* Show attendance proof buttons for non-leave statuses */}
                {!selectedItem?.status_kehadiran?.startsWith("Izin") && (
                  <>
                    {selectedItem?.bukti_kehadiran && (
                      <TouchableOpacity
                        onPress={() => setSelectedPhotoType("masuk")}
                        style={[styles.photoButton, selectedPhotoType === "masuk" && styles.activePhotoButton]}>
                        <Ionicons
                          name="log-in-outline"
                          size={20}
                          color={selectedPhotoType === "masuk" ? "#fff" : "#007AFF"}
                        />
                        <Text
                          style={[
                            styles.photoButtonText,
                            selectedPhotoType === "masuk" && styles.activePhotoButtonText,
                          ]}>
                          {t("history.checkIn")}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {selectedItem?.bukti_kehadiran2 && (
                      <TouchableOpacity
                        onPress={() => setSelectedPhotoType("pulang")}
                        style={[styles.photoButton, selectedPhotoType === "pulang" && styles.activePhotoButton]}>
                        <Ionicons
                          name="log-out-outline"
                          size={20}
                          color={selectedPhotoType === "pulang" ? "#fff" : "#007AFF"}
                        />
                        <Text
                          style={[
                            styles.photoButtonText,
                            selectedPhotoType === "pulang" && styles.activePhotoButtonText,
                          ]}>
                          {t("history.checkOut")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Show leave proof for leave statuses */}
                {selectedItem?.status_kehadiran?.startsWith("Izin") && selectedItem?.bukti_izin && (
                  <TouchableOpacity
                    onPress={() => setSelectedPhotoType("izin")}
                    style={[
                      styles.photoButton,
                      styles.leavePhotoButton,
                      selectedPhotoType === "izin" && styles.activeLeaveButton,
                    ]}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={selectedPhotoType === "izin" ? "#fff" : "#FF9500"}
                    />
                    <Text
                      style={[
                        styles.leavePhotoButtonText,
                        selectedPhotoType === "izin" && styles.activePhotoButtonText,
                      ]}>
                      {t("form.bukti")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Display selected photo */}
              {selectedPhotoType && (
                <View style={styles.photoContainer}>
                  {selectedPhotoType === "masuk" && selectedItem?.bukti_kehadiran && (
                    <Image source={{ uri: selectedItem.bukti_kehadiran }} style={styles.photo} resizeMode="contain" />
                  )}

                  {selectedPhotoType === "pulang" && selectedItem?.bukti_kehadiran2 && (
                    <Image source={{ uri: selectedItem.bukti_kehadiran2 }} style={styles.photo} resizeMode="contain" />
                  )}

                  {selectedPhotoType === "izin" && selectedItem?.bukti_izin && (
                    <>
                      <Image source={{ uri: selectedItem.bukti_izin }} style={styles.photo} resizeMode="contain" />
                      {/* <View style={styles.detailsCard}>
                        <Text style={styles.detailStatus}>{t}</Text>
                        <Text style={styles.detailDate}>{selectedItem.tanggal}</Text>
                      </View> */}
                    </>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Enhanced Content */}
      <View style={styles.contentContainer}>
        <View style={styles.contentHeader}>
          <View style={styles.greyLine} />

          {filteredData.length > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>{filteredData.length + t("history.found")}</Text>
            </View>
          )}
        </View>

        {historyLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item, idx) => (item?.id ? item.id.toString() : `item-${idx}`)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="calendar-outline" size={64} color="#C7C7CC" />
                </View>
                {/* <Text style={styles.emptyTitle}>{t("history.blank")}</Text> */}
                <Text style={styles.emptyText}>{t("history.blank")}</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#007AFF",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "column",
    gap: 20,
  },
  titleSection: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 4,
  },
  filterSection: {
    alignItems: "center",
  },
  filterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -15,
    paddingTop: 20,
  },
  contentHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greyLine: {
    height: 4,
    width: 40,
    backgroundColor: "#C7C7CC",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 8,
  },
  statsContainer: {
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  loadingCard: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  errorCard: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },
  statusIndicator: {
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contentSection: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  timeSeparator: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E5EA",
  },
  timeLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  chevronContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  modalContent: {
    padding: 20,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  photoModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  photoModalContent: {
    padding: 20,
  },
  detailsCard: {
    backgroundColor: "#F2F2F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  detailStatus: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 14,
    color: "#8E8E93",
  },
  photoButtonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  photoButton: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F2F2F7",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activePhotoButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
    textAlign: "center",
  },
  activePhotoButtonText: {
    color: "#fff",
  },
  leavePhotoButton: {
    backgroundColor: "#FFF3E0",
  },
  activeLeaveButton: {
    backgroundColor: "#FF9500",
  },
  leavePhotoButtonText: {
    color: "#FF9500",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  photoContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F2F2F7",
  },
  photo: {
    width: "100%",
    height: 300,
    backgroundColor: "#F2F2F7",
  },
});
