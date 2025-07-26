import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  // Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import API from "../utils/ApiConfig";
import CustomAlert from "../utils/CustomAlert";

const { height } = Dimensions.get("window");

export default function FormizinPopup({
  visible,
  onClose,
  events,
  disabledDates,
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(tomorrow);
  const [jamStart, setJamStart] = useState(new Date());
  const [jamKhir, setJamKhir] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showJamStart, setShowJamStart] = useState(false);
  const [showJamKhir, setShowJamKhir] = useState(false);
  const [jenis, setJenis] = useState(null);
  const [keterangan, setKeterangan] = useState("");
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const [items, setItems] = useState([]);
  const [image, setImage] = useState(null);

  const resetForm = () => {
    setStartDate(tomorrow);
    setEndDate(tomorrow);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setJenis(null);
    setOpen(false);
    setImage(null);
    setKeterangan("");
    setJamStart(new Date());
    setJamKhir(new Date());
    setShowJamStart(false);
    setShowJamKhir(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isHariLibur = (date) => {
    const ymd = date.toISOString().slice(0, 10);
    const isEventHoliday =
      Array.isArray(events) &&
      events.some((event) => event.start?.date === ymd);
    const day = date.getDay();
    const isWeekend = day === 0 || day === 6;
    const isDisabled = disabledDates.includes(ymd);
    return isEventHoliday || isWeekend || isDisabled;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleStartChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      // if (isHariLibur(selectedDate)) {
      //   Alert.alert("Tanggal tidak tersedia", "Tanggal ini adalah hari libur. Silakan pilih tanggal lain.");
      //   return;
      // }
      setStartDate(selectedDate);
      // Jika endDate < startDate, update endDate juga
      if (endDate < selectedDate) setEndDate(selectedDate);
    }
  };

  const handleEndChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      // if (isHariLibur(selectedDate)) {
      //   Alert.alert("Tanggal tidak tersedia", "Tanggal ini adalah hari libur. Silakan pilih tanggal lain.");
      //   return;
      // }
      setEndDate(selectedDate);
    }
  };

  const handleJamStart = (event, time) => {
    setShowJamStart(false);
    if (!time) return;
    const selected = new Date(time);
    const now = new Date();
    selected.setSeconds(0);
    if (selected.getTime() < now.getTime()) {
      Alert.alert("Tidak bisa memilih waktu kurang dari jam sekarang!");
    }
    setJamStart(selected);
  };

  const handleJamKhir = (event, time) => {
    console.log(jenis);
    setShowJamKhir(false);
    if (!time) return;
    const selected = new Date(time);
    selected.setSeconds(0);
    if (selected.getTime() < jamStart.getTime()) {
      Alert.alert("Jam berakhir tidak boleh kurang dari jam mulai!");
      return;
    }
    // TODO implementasi jamKhir tidak boleh dari jam shift dibawah sini
    setJamKhir(selected);
  };

  const formatDate = (date) =>
    date.toLocaleDateString("id-ID", {
      dateStyle: "medium",
    });

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const submitIzin = async () => {
    if (!startDate || !endDate || !jenis || !image) {
      Alert.alert("Error", "Semua field wajib diisi dan foto harus diambil");
      return;
    }
    console.log("Jenis izin yang dipilih:", jenis);

    console.log(startDate);
    // if (isHariLibur(startDate) || isHariLibur(endDate)) {
    //   Alert.alert("Tanggal tidak tersedia", "Tanggal yang dipilih adalah hari libur. Silakan pilih tanggal lain.");
    //   return;
    // }

    let id_pengguna = null;
    let id_shift = null;
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log(userData);
        id_pengguna = userData.id_pengguna;
        id_shift = userData.id_shift;
      }
    } catch (e) {
      Alert.alert("Error", "Gagal mengambil data pengguna");
      return;
    }

    if (!id_pengguna) {
      Alert.alert("Error", "Pengguna tidak ditemukan");
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "bukti_izin.jpg",
      type: "image/jpeg",
    });

    let endpoint = "";
    if (jenis === "PART") {
      endpoint = API.IZIN_SEMENTARA;
      formData.append(
        "izin",
        JSON.stringify({
          jamMulai: formatTime(jamStart),
          jamAkhir: formatTime(jamKhir),
          jenis_izin: jenis,
          id_pengguna: id_pengguna,
          keterangan: keterangan,
          id_shift: id_shift,
        })
      );
    } else if (jenis === "FULL") {
      endpoint = API.IZIN;
      formData.append(
        "izin",
        JSON.stringify({
          tanggal_awal: startDate.toISOString().split("T")[0],
          tanggal_akhir: endDate.toISOString().split("T")[0],
          jenis_izin: jenis,
          id_pengguna: id_pengguna,
          keterangan: keterangan,
          id_shift: id_shift,
        })
      );
    }

    try {
      const res = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert(res.data.data, res.data.message);
      console.log(res.data.message);

      handleClose();
    } catch (err) {
      console.log(res.data.message);

      Alert.alert(res.data.data, res.data.message);
    }
  };

  return (
    <Modal isVisible={visible} style={styles.modal}>
      <View style={styles.container}>
        {/* Enhanced Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.greyLine} />
          <View style={styles.headerContent}>
            <Text style={styles.title}>{t("form.title")}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Leave Type Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>{t("form.jenis.title")}</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  jenis === "FULL" && styles.toggleButtonSelected,
                ]}
                onPress={() => setJenis("FULL")}
              >
                <Text
                  style={
                    jenis === "FULL"
                      ? styles.toggleTextSelected
                      : styles.toggleText
                  }
                >
                  {t("form.jenis.full")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  jenis === "PART" && styles.toggleButtonSelected,
                ]}
                onPress={() => setJenis("PART")}
              >
                <Text
                  style={
                    jenis === "PART"
                      ? styles.toggleTextSelected
                      : styles.toggleText
                  }
                >
                  {t("form.jenis.part")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {jenis === "FULL" ? (
            <>
              {/* Date Selection Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t("form.tgl")}</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <Text style={styles.label}>{t("form.tglAwal")}</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#2E7BE8"
                      />
                      <Text style={styles.dateText}>
                        {formatDate(startDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateSeparator}>
                    <Ionicons name="arrow-forward" size={20} color="#8E8E93" />
                  </View>

                  <View style={styles.dateItem}>
                    <Text style={styles.label}>{t("form.tglAkhir")}</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#2E7BE8"
                      />
                      <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Document Upload Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t("form.bukti")}</Text>
                <TouchableOpacity
                  style={styles.imageUploadContainer}
                  onPress={pickImage}
                >
                  {image ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: image }}
                        style={styles.imagePreview}
                      />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="camera" size={24} color="#fff" />
                        <Text style={styles.changeImageText}>Change Photo</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <View style={styles.uploadIconContainer}>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={32}
                          color="#2E7BE8"
                        />
                      </View>
                      <Text style={styles.uploadText}>{t("form.img")}</Text>
                      <Text style={styles.uploadSubtext}>
                        Tap to select document
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Description Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t("form.keterangan")}</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder={t("form.placeholderKet")}
                  placeholderTextColor="#8E8E93"
                  value={keterangan}
                  onChangeText={setKeterangan}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          ) : jenis === "PART" ? (
            <>
              {/* Info Tanggal Izin */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t("form.tgl")}</Text>
                <View style={styles.dateInput}>
                  <Ionicons name="calendar-outline" size={20} color="#2E7BE8" />
                  <Text style={styles.dateText}>{formatDate(new Date())}</Text>
                </View>
              </View>

              {/* Time Selection Section */}
              <View style={styles.formSection}>
                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <Text style={styles.label}>{t("form.jamStart")}</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowJamStart(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#2E7BE8" />
                      <Text style={styles.dateText}>
                        {formatTime(jamStart)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateSeparator}>
                    <Ionicons name="arrow-forward" size={20} color="#8E8E93" />
                  </View>

                  <View style={styles.dateItem}>
                    <Text style={styles.label}>{t("form.jamKhir")}</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={() => setShowJamKhir(true)}
                    >
                      <Ionicons name="time-outline" size={20} color="#2E7BE8" />
                      <Text style={styles.dateText}>{formatTime(jamKhir)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Document Upload Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t("form.bukti")}</Text>
                <TouchableOpacity
                  style={styles.imageUploadContainer}
                  onPress={pickImage}
                >
                  {image ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: image }}
                        style={styles.imagePreview}
                      />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="camera" size={24} color="#fff" />
                        <Text style={styles.changeImageText}>Change Photo</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <View style={styles.uploadIconContainer}>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={32}
                          color="#2E7BE8"
                        />
                      </View>
                      <Text style={styles.uploadText}>{t("form.img")}</Text>
                      <Text style={styles.uploadSubtext}>
                        Tap to select document
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              {/* Description Section */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t("form.keterangan")}</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder={t("form.placeholderKet")}
                  placeholderTextColor="#8E8E93"
                  value={keterangan}
                  onChangeText={setKeterangan}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </>
          ) : (
            <View style={styles.warningContainer}>
              <Ionicons name="alert-circle" size={50} color="#FFC107" />
              <Text style={styles.warningText}>{t("form.jenis.default")}</Text>
            </View>
          )}
        </ScrollView>

        {/* Enhanced Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>{t("form.btnClose")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={submitIzin}>
            <Text style={styles.submitText}>{t("form.btnConfirm")}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartChange}
            minimumDate={tomorrow}
            maximumDate={endDate}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            onChange={handleEndChange}
            minimumDate={startDate}
          />
        )}

        {showJamStart && (
          <DateTimePicker
            value={jamStart}
            mode="time"
            is24Hour={false}
            onChange={handleJamStart}
            design="material"
          />
        )}

        {showJamKhir && (
          <DateTimePicker
            value={jamKhir}
            mode="time"
            is24Hour={false}
            onChange={handleJamKhir}
            design="material"
          />
        )}
      </View>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
    marginBottom: 20,
  },
  greyLine: {
    height: 4,
    width: 40,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: height * 0.6,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7BE8",
    marginBottom: 8,
  },
  placeholderStyle: {
    color: "#8E8E93",
    fontSize: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateSeparator: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: "#1C1C1E",
    fontWeight: "500",
  },
  imageUploadContainer: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
  },
  imagePreviewContainer: {
    position: "relative",
    height: 200,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  changeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: "#8E8E93",
  },
  descriptionInput: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1C1E",
    minHeight: 100,
  },
  jenisButtons: {
    flexDirection: "row",
    gap: 20,
  },
  actionButtons: {
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
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  submitButton: {
    flex: 2,
    backgroundColor: "#2E7BE8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },

  toggleButtonSelected: {
    backgroundColor: "#007AFF",
  },

  toggleText: {
    color: "#333",
    fontWeight: "500",
  },

  toggleTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  warningContainer: {
    // flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: 10,
    marginVertical: 20,
    borderRadius: 16,
  },
  warningText: {
    color: "#F57F17",
    flexShrink: 1,
    fontWeight: "bold",
  },
});
