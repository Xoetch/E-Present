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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Alert,
} from "react-native";
import Modal from "react-native-modal";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";

import API from "../utils/ApiConfig";
const { width } = Dimensions.get("window");

// Constants - moved outside component to prevent recreation
const FILTER_ALL = "All";
const YEAR_RANGE_START = 2020;
const YEAR_RANGE_LENGTH = 10;

// Localization and color mapping functions (same as HomeScreen)
const mapLabelToTranslationKey = (apiLabel, jenisIzin) => {
  const normalizedLabel = apiLabel.toLowerCase();
  if (normalizedLabel.includes("alfa") || normalizedLabel.includes("alpa")) return "general.alfa";
  if (normalizedLabel.includes("terlambat")) return "history.telat";
  if (normalizedLabel.includes("tidak absen pulang")) return "history.tidakAbsen";
  if (normalizedLabel.includes("izin")) {
    // Check if it's full day leave
    if (jenisIzin === "FULL") return "history.izinFull";
    else if (jenisIzin === "PART") return "history.izinPart";
    return "general.izin";
  }
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
    case "history.izinPart":
    case "history.izinFull":
      return "#FFC107";
    case "general.hadir":
      return "#4CAF50";
    default:
      return "#9E9E9E";
  }
};

// Enhanced status configurations with localized mapping
const getStatusConfig = (apiLabel, t, jenisIzin) => {
  const translationKey = mapLabelToTranslationKey(apiLabel, jenisIzin);
  const primaryColor = getColorByStatus(translationKey);

  // Generate lighter color for background
  const lightColor = primaryColor + "20"; // Add transparency

  // Icon mapping based on translation key
  const getIcon = (key) => {
    switch (key) {
      case "general.hadir":
        return "checkmark-circle";
      case "general.izin":
      case "history.izinPart":
      case "history.izinFull":
        return "briefcase";
      case "general.alfa":
        return "close-circle";
      case "history.telat":
        return "time-outline";
      case "history.tidakAbsen":
        return "log-out-outline";
      default:
        return "help-circle";
    }
  };

  return {
    icon: getIcon(translationKey),
    primaryColor,
    lightColor,
    textColor: primaryColor,
    translatedLabel: t(translationKey),
    translationKey,
  };
};

// Function to get izin status text and color
const getIzinStatusConfig = (statusIzin, t) => {
  switch (statusIzin) {
    case 0:
      return {
        text: t("history.waiting"),
        color: "#FF9500",
        backgroundColor: "#FFF3E0",
        icon: "time-outline"
      };
    case -1:
      return {
        text: t("history.ditolak"),
        color: "#FF3B30",
        backgroundColor: "#FFEBEE",
        icon: "close-circle"
      };
    case 1:
      return {
        text: t("history.diterima"),
        color: "#34C759",
        backgroundColor: "#E8F5E8",
        icon: "checkmark-circle"
      };
    default:
      return {
        text: t("history.statusTidakDiketahui"),
        color: "#8E8E93",
        backgroundColor: "#F2F2F7",
        icon: "help-circle"
      };
  }
};

// Function to determine what proof buttons to show based on attendance status and available data
const getProofButtonsConfig = (item) => {
  if (!item || !item.status_kehadiran) return { showCheckIn: false, showCheckOut: false, showLeave: false };

  const statusLower = item.status_kehadiran.toLowerCase();
  const isIzin = statusLower.includes("izin");
  const isAlfa = statusLower.includes("alfa") || statusLower.includes("alpa");
  const isTidakAbsenPulang = statusLower.includes("tidak absen pulang");
  const isFullLeave = item.jenis_izin === "FULL";

  // Alfa - no proof needed since they didn't come to work at all
  if (isAlfa) {
    return { showCheckIn: false, showCheckOut: false, showLeave: false };
  }

  // Full day leave - only show leave proof
  if (isIzin && isFullLeave) {
    return { 
      showCheckIn: false, 
      showCheckOut: false, 
      showLeave: true 
    };
  }

  // Partial leave - show both attendance and leave proof
  if (isIzin && !isFullLeave) {
    return { 
      showCheckIn: !!item.bukti_kehadiran, 
      showCheckOut: !!item.bukti_kehadiran2, 
      showLeave: true 
    };
  }

  // Tidak absen pulang - only show check in proof, no check out
  if (isTidakAbsenPulang) {
    return { 
      showCheckIn: !!item.bukti_kehadiran, 
      showCheckOut: false, 
      showLeave: false 
    };
  }

  // Regular attendance (hadir, terlambat) - show available attendance proofs
  return { 
    showCheckIn: !!item.bukti_kehadiran, 
    showCheckOut: !!item.bukti_kehadiran2, 
    showLeave: false 
  };
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
      console.log("Fetched history data:", result);

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

  const downloadPDF = async (url, filename = "bukti_izin.pdf") => {
    try {
      const fileUri = FileSystem.documentDirectory + "bukti_izin.pdf";

      console.log("🔗 URL PDF:", url);
      // Download file
      const res = await FileSystem.downloadAsync(url, fileUri);

      if (res.status !== 200) {
        Alert.alert("Gagal", `Download gagal dengan status: ${res.status}`);
        return;
      }

      // Cek ukuran file
      const fileInfo = await FileSystem.getInfoAsync(res.uri);
      if (fileInfo.size === 0) {
        Alert.alert(
          "Gagal",
          "File PDF kosong (0 KB). URL tidak valid atau gagal diunduh."
        );
        return;
      }

      console.log("✅ PDF berhasil diunduh:", res.uri, fileInfo);

      // Pastikan perangkat bisa sharing
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Error", "Fitur sharing tidak tersedia di perangkat ini.");
        return;
      }

      // Share file
      await Sharing.shareAsync(res.uri);
    } catch (error) {
      console.error("❌ Gagal membuka PDF:", error);
      Alert.alert("Gagal", `Gagal membuka PDF: ${error.message}`);
    }
  };

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

      // For type filter, check if it's any type of izin
      const matchType = selectedType === FILTER_ALL || 
        item.status_kehadiran === selectedType ||
        (selectedType === "Izin" && item.status_kehadiran?.toLowerCase().includes("izin"));

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

  // Render item component with enhanced design and localization
  const renderItem = useCallback(
    ({ item }) => {
      if (!item || !item.status_kehadiran) return null;

      // Get localized status configuration
      const statusConfig = getStatusConfig(item.status_kehadiran, t, item.jenis_izin);
      const { icon, primaryColor, lightColor, textColor, translatedLabel } = statusConfig;

      return (
        <TouchableOpacity onPress={() => handleItemPress(item)} style={styles.itemContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: lightColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: primaryColor }]}>
              <Ionicons name={icon} size={24} color="#fff" />
            </View>
          </View>

          <View style={styles.contentSection}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: textColor }]}>{translatedLabel}</Text>
            </View>

            <View style={styles.shiftRow}>
              <View style={[styles.statusBadge, { backgroundColor: lightColor }]}>
                <Text style={[styles.badgeText, { color: textColor }]} numberOfLines={1}>
                  {item.shift_kerja}
                </Text>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
              <Text style={styles.dateText}>{item.tanggal}</Text>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeItem}>
                <Ionicons name="log-in-outline" size={14} color="#34C759" />
                <Text style={styles.timeLabel}>{t("history.masuk")}</Text>
                <Text style={[styles.timeValue, { color: "#34C759" }]}>{formatTime(item.jam_masuk)}</Text>
              </View>

              <View style={styles.timeSeparator} />

              <View style={styles.timeItem}>
                <Ionicons name="log-out-outline" size={14} color="#FF3B30" />
                <Text style={styles.timeLabel}>{t("history.pulang")}</Text>
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
    [handleItemPress, t]
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
      <Modal
        isVisible={modalVisible}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        backdropTransitionInTiming={700}
        backdropTransitionOutTiming={300}
        onBackdropPress={() => setModalVisible(false)}
        style={{ margin: 0, justifyContent: "flex-end" }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("filterhistory.title")}</Text>
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
                  <Picker.Item label={t("history.tidakAbsen")} value="Tidak absen pulang" />
                  <Picker.Item label={t("history.telat")} value="Terlambat" />
                </Picker>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>
                {t("filterhistory.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
              <Text style={styles.applyButtonText}>
                {t("filterhistory.btn")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Enhanced Photo Modal */}
      <Modal
        isVisible={photoModalVisible}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropOpacity={0.5}
        backdropTransitionInTiming={700}
        backdropTransitionOutTiming={300}
        onBackdropPress={() => setPhotoModalVisible(false)}
        style={{ margin: 0, justifyContent: "flex-end" }}>
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
                <Text style={styles.detailStatus}>
                  {getStatusConfig(selectedItem.status_kehadiran, t, selectedItem.jenis_izin).translatedLabel}
                </Text>
                <Text style={styles.detailDate}>{selectedItem.tanggal}</Text>
                
                {/* Show izin details if it's a leave request */}
                {selectedItem.status_kehadiran?.toLowerCase().includes("izin") && (
                  <View style={styles.izinDetailsContainer}>
                    {/* Keterangan Izin */}
                    {selectedItem.keterangan_izin && (
                      <View style={styles.izinDetailRow}>
                        <Text style={styles.izinDetailLabel}>{t("history.keterangan")}:</Text>
                        <Text style={styles.izinDetailValue}>{selectedItem.keterangan_izin}</Text>
                      </View>
                    )}
                    
                    {/* Status Izin */}
                    {selectedItem.status_izin !== undefined && (
                      <View style={styles.izinDetailRow}>
                        <Text style={styles.izinDetailLabel}>{t("history.statusIzin")}:</Text>
                        <View style={[
                          styles.statusIzinBadge, 
                          { backgroundColor: getIzinStatusConfig(selectedItem.status_izin, t).backgroundColor }
                        ]}>
                          <Ionicons 
                            name={getIzinStatusConfig(selectedItem.status_izin, t).icon} 
                            size={14} 
                            color={getIzinStatusConfig(selectedItem.status_izin, t).color} 
                          />
                          <Text style={[
                            styles.statusIzinText, 
                            { color: getIzinStatusConfig(selectedItem.status_izin, t).color }
                          ]}>
                            {getIzinStatusConfig(selectedItem.status_izin, t).text}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Dynamic proof buttons based on attendance status and available data */}
            {(() => {
              const proofConfig = getProofButtonsConfig(selectedItem);
              const hasAnyProof = proofConfig.showCheckIn || proofConfig.showCheckOut || proofConfig.showLeave;

              // Only show buttons grid if there's any proof to show
              if (!hasAnyProof) {
                return (
                  <View style={styles.noProofContainer}>
                    <Ionicons name="document-outline" size={48} color="#C7C7CC" />
                    <Text style={styles.noProofText}>{t("history.noProof")}</Text>
                  </View>
                );
              }

              return (
                <View style={styles.photoButtonsGrid}>
                  {/* Show check in proof button */}
                  {proofConfig.showCheckIn && (
                    <TouchableOpacity
                      onPress={() => setSelectedPhotoType("masuk")}
                      style={[styles.photoButton, selectedPhotoType === "masuk" && styles.activePhotoButton]}>
                      <Ionicons
                        name="log-in-outline"
                        size={20}
                        color={selectedPhotoType === "masuk" ? "#fff" : "#007AFF"}
                      />
                      <Text
                        style={[styles.photoButtonText, selectedPhotoType === "masuk" && styles.activePhotoButtonText]}>
                        {t("history.checkIn")}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Show check out proof button */}
                  {proofConfig.showCheckOut && (
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

                  {/* Show leave proof button */}
                  {proofConfig.showLeave && (
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
                        style={[styles.leavePhotoButtonText, selectedPhotoType === "izin" && styles.activePhotoButtonText]}>
                        {t("form.bukti")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

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
                  <View
                    style={{ alignItems: "center", marginTop: 24, padding: 16 }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={80}
                      color="#FF9500"
                    />


                    <TouchableOpacity
                      onPress={() => downloadPDF(selectedItem?.bukti_izin)}
                      style={{
                        marginTop: 16,
                        backgroundColor: "#FF9500",
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 5,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          fontSize: 16,
                        }}
                      >
                        Download {t("form.bukti")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
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
    marginBottom: 12,
  },
  izinDetailsContainer: {
    width: "100%",
    gap: 12,
  },
  izinDetailRow: {
    flexDirection: "column",
    gap: 4,
  },
  izinDetailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  izinDetailValue: {
    fontSize: 14,
    color: "#8E8E93",
    lineHeight: 20,
  },
  statusIzinBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    alignSelf: "flex-start",
  },
  statusIzinText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noProofContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  noProofText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
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
  statusRow: {
    marginBottom: 4,
  },
  shiftRow: {
    marginBottom: 8,
    alignItems: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: "100%",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});