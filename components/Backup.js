//                         import { Ionicons } from "@expo/vector-icons";
//                         import AsyncStorage from "@react-native-async-storage/async-storage";
//                         import { Picker } from "@react-native-picker/picker";
//                         import { useFocusEffect } from "@react-navigation/native";
//                         import { useCallback, useEffect, useState } from "react";
//                         import { useTranslation } from "react-i18next";
//                         import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
//                         import API from "../utils/ApiConfig";

//                         const months = [
//                         "Januari",
//                         "Februari",
//                         "Maret",
//                         "April",
//                         "Mei",
//                         "Juni",
//                         "Juli",
//                         "Agustus",
//                         "September",
//                         "Oktober",
//                         "November",
//                         "Desember",
//                         ];

//                         export default function HistoryScreen() {
//                         const currentDate = new Date();
//                         const { t, i18n } = useTranslation();

//                         const months = [
//                             t("months.january"),
//                             t("months.february"),
//                             t("months.march"),
//                             t("months.april"),
//                             t("months.may"),
//                             t("months.june"),
//                             t("months.july"),
//                             t("months.august"),
//                             t("months.september"),
//                             t("months.october"),
//                             t("months.november"),
//                             t("months.december"),
//                         ];

//                         // 1. State untuk id_pengguna
//                         const [userId, setUserId] = useState(null);

//                         // 5. State untuk hasil API
//                         const [historyData, setHistoryData] = useState([]);

//                         const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
//                         const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
//                         const [selectedType, setSelectedType] = useState("All");

//                         const [tempMonth, setTempMonth] = useState(selectedMonth);
//                         const [tempYear, setTempYear] = useState(selectedYear);
//                         const [tempType, setTempType] = useState(selectedType);

//                         const [modalVisible, setModalVisible] = useState(false);
//                         const [filteredData, setFilteredData] = useState([]);

//                         const [selectedItem, setSelectedItem] = useState(null);
//                         const [photoModalVisible, setPhotoModalVisible] = useState(false);
//                         const [selectedPhotoType, setSelectedPhotoType] = useState(null); // "masuk", "pulang", "izin"

//                         const handleItemPress = async (item) => {
//                             console.log("ITEM SELECTED:", item);
//                             setSelectedItem(item);
//                             setSelectedPhotoType(null);
//                             setPhotoModalVisible(true);
//                         };

//                         const formatTime = (timeStr) => {
//                             if (!timeStr) return "-";
//                             if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
//                             if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.slice(0, 5);
//                             const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i);
//                             if (match) {
//                             let hour = parseInt(match[1], 10);
//                             const minute = match[2];
//                             const ampm = match[3];
//                             if (ampm) {
//                                 if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
//                                 if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
//                             }
//                             return `${hour.toString().padStart(2, "0")}:${minute}`;
//                             }
//                             return timeStr;
//                         };

//                         // 1. Ambil id_pengguna dari AsyncStorage
//                         useEffect(() => {
//                             const fetchUserId = async () => {
//                             try {
//                                 const dataString = await AsyncStorage.getItem("userData");
//                                 if (dataString) {
//                                 const data = JSON.parse(dataString);
//                                 setUserId(data.id_pengguna);
//                                 }
//                             } catch (e) {
//                                 console.log("Gagal mengambil userData:", e);
//                             }
//                             };
//                             fetchUserId();
//                         }, []);

//                         // Ganti useEffect fetch history dengan useFocusEffect
//                         useFocusEffect(
//                             useCallback(() => {
//                             const fetchHistory = async () => {
//                                 if (!userId) return;
//                                 try {
//                                 const response = await fetch(`${API.HISTORY}/${userId}`);
//                                 const result = await response.json();
//                                 // 6. Struktur data: tanggal, jam_masuk, jam_keluar, shift_kerja, status_kehadiran, bukti_kehadiran
//                                 if (result) {
//                                     setHistoryData(result.data);
//                                 } else {
//                                     setHistoryData([]);
//                                 }
//                                 } catch (e) {
//                                 console.log("Gagal mengambil history:", e);
//                                 setHistoryData([]);
//                                 }
//                             };
//                             fetchHistory();
//                             }, [userId])
//                         );

//                         // Fungsi untuk filter data berdasarkan filter aktif (gunakan historyData)
//                         const applyFilter = () => {
//                             const filtered = historyData.filter((item) => {
//                             const itemDate = new Date(item.tanggal);
//                             const matchMonth = tempMonth === "All" || itemDate.getMonth() === parseInt(tempMonth);
//                             const matchYear = tempYear === "All" || itemDate.getFullYear() === parseInt(tempYear);
//                             const matchType = tempType === "All" || item.status_kehadiran === tempType;
//                             return matchMonth && matchYear && matchType;
//                             });

//                             setSelectedMonth(tempMonth);
//                             setSelectedYear(tempYear);
//                             setSelectedType(tempType);
//                             setFilteredData(filtered);
//                             setModalVisible(false);
//                         };

//                         // Saat pertama kali load dan setiap historyData berubah
//                         useEffect(() => {
//                             applyFilter();
//                         }, [historyData]);

//                         const getMonthYearLabel = () => {
//                             const isAllMonth = selectedMonth === "All";
//                             const isAllYear = selectedYear === "All";
//                             if (isAllMonth && isAllYear) return t("history.semuaWaktu");
//                             if (!isAllMonth && isAllYear) return `${months[parseInt(selectedMonth)]}`;
//                             if (isAllMonth && !isAllYear) return `${selectedYear}`;
//                             return `${months[parseInt(selectedMonth)]} ${selectedYear}`;
//                         };

//                         // Render item untuk data dari API
//                         const renderItem = ({ item }) => {
//                             const { status_kehadiran } = item;
//                             console.log("Status Kehadiran:", status_kehadiran);

//                             const isHadir = status_kehadiran === "Hadir";

//                             const getBaseStatus = () => {
//                             if (status_kehadiran.startsWith("Izin")) return "Izin";
//                             if (status_kehadiran === "Hadir") return "Hadir";
//                             if (status_kehadiran === "Sakit") return "Sakit";
//                             if (status_kehadiran === "Alpa") return "Alpa";
//                             if (status_kehadiran === "Cuti") return "Cuti";
//                             return "Lainnya";
//                             };

//                             const baseStatus = getBaseStatus();

//                             const iconMap = {
//                             Hadir: { icon: "checkmark-circle", color: "#4CAF50" },
//                             Izin: { icon: "alert-circle", color: "#FFC107" },
//                             Sakit: { icon: "medkit", color: "#03A9F4" },
//                             Alpa: { icon: "close-circle", color: "#F44336" },
//                             Cuti: { icon: "briefcase", color: "#9C27B0" },
//                             Lainnya: { icon: "help-circle", color: "#9E9E9E" },
//                             };

//                             const { icon, color } = iconMap[baseStatus];

//                             return (
//                             <TouchableOpacity onPress={() => handleItemPress(item)}>
//                                 <View style={styles.itemContainer}>
//                                 <View style={[styles.circleIcon, { backgroundColor: color }]}>
//                                     <Ionicons name={icon} size={20} color="#fff" />
//                                 </View>
//                                 <View style={styles.textContainer}>
//                                     <Text style={styles.typeText}>{status_kehadiran}</Text>
//                                     <Text style={styles.dateText}>{item.tanggal}</Text>
//                                     <Text style={[styles.timeText, { color }]}>
//                                     {formatTime(item.jam_masuk)} | {formatTime(item.jam_keluar)}
//                                     </Text>
//                                     <Text style={styles.dateText}>Shift: {item.shift_kerja}</Text>
//                                 </View>
//                                 </View>
//                             </TouchableOpacity>
//                             );
//                         };

//                         return (
//                             <View style={styles.container}>
//                             {/* Header */}
//                             <View style={styles.header}>
//                                 <View style={styles.filterCard}>
//                                 <Ionicons name="calendar-outline" size={20} color="#2E7BE8" />
//                                 <Text style={styles.filterText}>{getMonthYearLabel()}</Text>
//                                 </View>
//                                 <TouchableOpacity
//                                 style={styles.filterButton}
//                                 onPress={() => {
//                                     setTempMonth(selectedMonth);
//                                     setTempYear(selectedYear);
//                                     setTempType(selectedType);
//                                     setModalVisible(true);
//                                 }}>
//                                 <Ionicons name="options-outline" size={20} color="#2E7BE8" />
//                                 </TouchableOpacity>
//                             </View>

//                             {/* Modal Filter */}
//                             <Modal visible={modalVisible} transparent animationType="fade">
//                                 <View style={styles.modalOverlay}>
//                                 <View style={styles.modalContent}>
//                                     <Text style={styles.modalTitle}>Filter</Text>

//                                     <Text style={styles.modalSubtitle}>{t("history.bulan")}</Text>
//                                     <Picker selectedValue={tempMonth} onValueChange={(itemValue) => setTempMonth(itemValue)}>
//                                     <Picker.Item label={t("general.semua")} value="All" />
//                                     {months.map((month, index) => (
//                                         <Picker.Item key={index} label={month} value={index.toString()} />
//                                     ))}
//                                     </Picker>

//                                     <Text style={styles.modalSubtitle}>{t("history.tahun")}</Text>
//                                     <Picker selectedValue={tempYear} onValueChange={(itemValue) => setTempYear(itemValue)}>
//                                     <Picker.Item label={t("general.semua")} value="All" />
//                                     {Array.from({ length: 10 }, (_, i) => {
//                                         const year = 2020 + i;
//                                         return <Picker.Item key={year} label={year.toString()} value={year.toString()} />;
//                                     })}
//                                     </Picker>

//                                     <Text style={styles.modalSubtitle}>{t("history.jenis")}</Text>
//                                     <Picker selectedValue={tempType} onValueChange={(itemValue) => setTempType(itemValue)}>
//                                     <Picker.Item label={t("general.semua")} value="All" />
//                                     <Picker.Item label={t("general.masuk")} value="Masuk Kerja" />
//                                     <Picker.Item label={t("general.pulang")} value="Pulang Kerja" />
//                                     <Picker.Item label={t("history.tidakMasuk")} value="Tidak Masuk" />
//                                     </Picker>

//                                     <TouchableOpacity style={styles.modalButton} onPress={applyFilter}>
//                                     <Text style={{ color: "#fff", fontWeight: "bold" }}>{t("history.btn")}</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                                 </View>
//                             </Modal>

//                             <Modal visible={photoModalVisible} transparent animationType="slide">
//                                 <View style={styles.modalOverlay}>
//                                 <View style={[styles.modalContent, { maxHeight: 500 }]}>
//                                     <Text style={styles.modalTitle}>Detail Kehadiran</Text>

//                                     <View
//                                     style={{
//                                         flexDirection: "row",
//                                         justifyContent: "space-around",
//                                         marginVertical: 10,
//                                     }}>
//                                     {/* Hanya tampilkan Bukti Masuk dan Pulang jika status bukan Izin */}
//                                     {selectedItem?.status_kehadiran !== "Izin - menunggu persetujuan" &&
//                                         selectedItem?.status_kehadiran !== "Izin" && (
//                                         <>
//                                             {selectedItem?.bukti_kehadiran && (
//                                             <TouchableOpacity onPress={() => setSelectedPhotoType("masuk")}>
//                                                 <Text style={{ color: "#2E7BE8", fontWeight: "bold" }}>Bukti Masuk</Text>
//                                             </TouchableOpacity>
//                                             )}
//                                             {selectedItem?.bukti_kehadiran2 && (
//                                             <TouchableOpacity onPress={() => setSelectedPhotoType("pulang")}>
//                                                 <Text style={{ color: "#2E7BE8", fontWeight: "bold" }}>Bukti Pulang</Text>
//                                             </TouchableOpacity>
//                                             )}
//                                         </>
//                                         )}

//                                     {/* Tampilkan Bukti Izin hanya jika status mengandung "Izin" */}
//                                     {selectedItem?.status_kehadiran?.startsWith("Izin") && selectedItem?.bukti_izin && (
//                                         <TouchableOpacity onPress={() => setSelectedPhotoType("izin")}>
//                                         <Text style={{ color: "#F39C12", fontWeight: "bold" }}>Bukti Izin</Text>
//                                         </TouchableOpacity>
//                                     )}
//                                     </View>

//                                     {/* Tampilkan Foto Sesuai Pilihan */}
//                                     {selectedPhotoType === "masuk" && selectedItem?.bukti_kehadiran && (
//                                     <>
//                                         <Image source={{ uri: selectedItem.bukti_kehadiran }} style={styles.photo} resizeMode="contain" />
//                                     </>
//                                     )}

//                                     {selectedPhotoType === "pulang" && selectedItem?.bukti_kehadiran2 && (
//                                     <>
//                                         <Image source={{ uri: selectedItem.bukti_kehadiran2 }} style={styles.photo} resizeMode="contain" />
//                                     </>
//                                     )}

//                                     {selectedPhotoType === "izin" && selectedItem?.bukti_izin && (
//                                     <>
//                                         <Image source={{ uri: selectedItem?.bukti_izin }} style={styles.photo} resizeMode="contain" />
//                                     </>
//                                     )}

//                                     <TouchableOpacity style={styles.modalButton} onPress={() => setPhotoModalVisible(false)}>
//                                     <Text style={{ color: "#fff", fontWeight: "bold" }}>Tutup</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                                 </View>
//                             </Modal>

//                             {/* List */}
//                             <View style={styles.contentContainer}>
//                                 <View style={styles.greyLine} />
//                                 <Text style={styles.title}>{t("history.title")}</Text>
//                                 <FlatList
//                                 data={filteredData}
//                                 keyExtractor={(item, idx) => (item.id ? item.id.toString() : idx.toString())}
//                                 renderItem={renderItem}
//                                 contentContainerStyle={styles.listContent}
//                                 showsVerticalScrollIndicator={false}
//                                 ListEmptyComponent={<Text style={styles.emptyText}>{t("history.blank")}</Text>}
//                                 />
//                             </View>
//                             </View>
//                         );
//                         }

//                         const styles = StyleSheet.create({
//                         container: { flex: 1, backgroundColor: "#2E7BE8" },
//                         header: {
//                             flexDirection: "row",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             paddingTop: 60,
//                             paddingHorizontal: 20,
//                             backgroundColor: "#2E7BE8",
//                             paddingBottom: 20,
//                         },
//                         filterCard: {
//                             flexDirection: "row",
//                             alignItems: "center",
//                             backgroundColor: "#fff",
//                             paddingVertical: 8,
//                             paddingHorizontal: 14,
//                             borderRadius: 20,
//                             elevation: 9,
//                         },
//                         filterText: {
//                             color: "#2E7BE8",
//                             fontWeight: "bold",
//                             fontSize: 18,
//                             marginLeft: 8,
//                         },
//                         filterButton: {
//                             backgroundColor: "#fff",
//                             padding: 10,
//                             borderRadius: 30,
//                             elevation: 8,
//                         },
//                         contentContainer: {
//                             flex: 1,
//                             backgroundColor: "#FFF",
//                             borderTopLeftRadius: 30,
//                             borderTopRightRadius: 30,
//                             paddingTop: 24,
//                             paddingHorizontal: 16,
//                         },
//                         title: {
//                             fontSize: 24,
//                             fontWeight: "bold",
//                             color: "#6B7280",
//                             alignSelf: "center",
//                             marginVertical: 16,
//                         },
//                         listContent: { paddingBottom: 80 },
//                         itemContainer: {
//                             flexDirection: "row",
//                             alignItems: "center",
//                             backgroundColor: "#fff",
//                             borderRadius: 14,
//                             padding: 14,
//                             marginBottom: 12,
//                             elevation: 1,
//                             shadowColor: "#000",
//                             shadowOpacity: 0.05,
//                             shadowOffset: { width: 0, height: 1 },
//                             shadowRadius: 2,
//                         },
//                         circleIcon: {
//                             width: 36,
//                             height: 36,
//                             borderRadius: 18,
//                             justifyContent: "center",
//                             alignItems: "center",
//                             marginRight: 12,
//                         },
//                         textContainer: { flex: 1 },
//                         typeText: { fontSize: 16, fontWeight: "bold", color: "#007AFF" },
//                         dateText: { fontSize: 13, color: "#777" },
//                         timeText: { fontSize: 15, fontWeight: "bold" },
//                         emptyText: { textAlign: "center", color: "#999", marginTop: 50 },
//                         modalOverlay: {
//                             flex: 1,
//                             justifyContent: "center",
//                             backgroundColor: "rgba(0,0,0,0.4)",
//                         },
//                         modalContent: {
//                             backgroundColor: "#fff",
//                             marginHorizontal: 30,
//                             borderRadius: 12,
//                             padding: 20,
//                         },
//                         modalTitle: {
//                             fontSize: 18,
//                             fontWeight: "bold",
//                             marginBottom: 10,
//                             alignSelf: "center",
//                         },
//                         modalSubtitle: {
//                             fontSize: 14,
//                             fontWeight: "600",
//                             color: "#333",
//                             marginTop: 10,
//                             marginBottom: 4,
//                         },
//                         modalButton: {
//                             backgroundColor: "#2E7BE8",
//                             marginTop: 16,
//                             padding: 10,
//                             borderRadius: 10,
//                             alignItems: "center",
//                         },
//                         greyLine: {
//                             height: 6,
//                             width: 80,
//                             backgroundColor: "#ccc",
//                             borderRadius: 3,
//                             alignSelf: "center",
//                             marginBottom: 8,
//                         },
//                         photo: {
//                             width: "100%",
//                             height: 180,
//                             borderRadius: 10,
//                             marginBottom: 12,
//                             backgroundColor: "#f0f0f0",
//                         },
// });

// // NOTE ini adalah bagian backup rekap absensi. Sekarang dimasukin sini dulu karena kemungkinan di replace
// {/* <View style={styles.card}>
//             <View style={styles.rowBetween}>
//               <Text style={styles.cardTitle}>{t("home.history")}</Text>
//               <TouchableOpacity onPress={() => handleNavigation("History")}>
//                 <Text style={styles.link}>{t("home.lihat")}</Text>
//               </TouchableOpacity>
//             </View>

//             <View style={{ marginTop: 8 }}>
//               {recentAttendance.map((item) => (
//                 <View
//                   key={item.id}
//                   style={{
//                     flexDirection: "row",
//                     alignItems: "center",
//                     backgroundColor: "#fff",
//                     borderRadius: 12,
//                     padding: 12,
//                     marginBottom: 10,
//                     elevation: 2,
//                   }}>
//                   <View
//                     style={{
//                       backgroundColor: item.type === "Hadir" ? "#4CAF50" : "#F44336",
//                       borderRadius: 25,
//                       width: 40,
//                       height: 40,
//                       alignItems: "center",
//                       justifyContent: "center",
//                       marginRight: 12,
//                     }}>
//                     <Ionicons name="time-outline" size={20} color="#fff" />
//                   </View>

//                   <View style={{ flex: 1 }}>
//                     <Text
//                       style={{
//                         color: item.type === "Masuk Kerja" ? "#2E7BE8" : "#F44336",
//                         fontWeight: "bold",
//                         fontSize: 14,
//                       }}>
//                       {item.type}
//                     </Text>
//                     <Text style={{ color: "#888", fontSize: 12 }}>{item.date}</Text>
//                   </View>

//                   <Text
//                     style={{
//                       color: item.type === "Masuk Kerja" ? "#4CAF50" : "#F44336",
//                       fontWeight: "bold",
//                       fontSize: 14,
//                     }}>
//                     {formatToAMPM(item.time)}
//                   </Text>
//                 </View>
//               ))}
//             </View>
//           </View> */}


// TODO bagian ini adalah backup modal Form Izin

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import axios from "axios";
// import * as ImagePicker from "expo-image-picker";
// import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { Alert, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
// import DropDownPicker from "react-native-dropdown-picker";
// import Modal from "react-native-modal";
// import API from "../utils/ApiConfig";
// import { Ionicons } from "@expo/vector-icons";

// export default function FormizinPopup({ visible, onClose, events, disabledDates }) {
//   const tomorrow = new Date();
//   tomorrow.setDate(tomorrow.getDate() + 1);
//   const [startDate, setStartDate] = useState(tomorrow);
//   const [endDate, setEndDate] = useState(tomorrow);
//   const [showStartPicker, setShowStartPicker] = useState(false);
//   const [showEndPicker, setShowEndPicker] = useState(false);
//   const [jenis, setJenis] = useState(null);
//   const [keterangan, setKeterangan] = useState("");
//   const [open, setOpen] = useState(false);
//   const { t, i18n } = useTranslation();

//   const [items, setItems] = useState([]);
//   const [image, setImage] = useState(null);

//   useEffect(() => {
//     setItems([
//       { label: t("form.jenis.sakit"), value: "sakit" },
//       { label: t("form.jenis.izin"), value: "izin" },
//       { label: t("form.jenis.cuti"), value: "cuti" },
//       { label: t("form.jenis.sebagian"), value: "sebagian" },
//     ]);
//   }, [t, i18n.language]);

//   const resetForm = () => {
//     setStartDate(tomorrow);
//     setEndDate(tomorrow);
//     setShowStartPicker(false);
//     setShowEndPicker(false);
//     setJenis(null);
//     setOpen(false);
//     setImage(null);
//     setKeterangan("");
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   const isHariLibur = (date) => {
//     const ymd = date.toISOString().slice(0, 10);
//     const isEventHoliday = Array.isArray(events) && events.some((event) => event.start?.date === ymd);
//     const day = date.getDay();
//     const isWeekend = day === 0 || day === 6;
//     const isDisabled = disabledDates.includes(ymd);
//     return isEventHoliday || isWeekend || isDisabled;
//   };

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 1,
//     });

//     if (!result.canceled) {
//       setImage(result.assets[0].uri);
//     }
//   };

//   const handleStartChange = (event, selectedDate) => {
//     setShowStartPicker(false);
//     if (selectedDate) {
//       if (isHariLibur(selectedDate)) {
//         Alert.alert("Tanggal tidak tersedia", "Tanggal ini adalah hari libur. Silakan pilih tanggal lain.");
//         return;
//       }
//       setStartDate(selectedDate);
//       // Jika endDate < startDate, update endDate juga
//       if (endDate < selectedDate) setEndDate(selectedDate);
//     }
//   };

//   const handleEndChange = (event, selectedDate) => {
//     setShowEndPicker(false);
//     if (selectedDate) {
//       if (isHariLibur(selectedDate)) {
//         Alert.alert("Tanggal tidak tersedia", "Tanggal ini adalah hari libur. Silakan pilih tanggal lain.");
//         return;
//       }
//       setEndDate(selectedDate);
//     }
//   };

//   const formatDate = (date) =>
//     date.toLocaleDateString("id-ID", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });

//   const submitIzin = async () => {
//     if (!startDate || !endDate || !jenis || !image) {
//       Alert.alert("Error", "Semua field wajib diisi dan foto harus diambil");
//       return;
//     }
//     console.log(startDate);
//     if (isHariLibur(startDate) || isHariLibur(endDate)) {
//       Alert.alert("Tanggal tidak tersedia", "Tanggal yang dipilih adalah hari libur. Silakan pilih tanggal lain.");
//       return;
//     }

//     let id_pengguna = null;
//     try {
//       const userDataString = await AsyncStorage.getItem("userData");
//       if (userDataString) {
//         const userData = JSON.parse(userDataString);
//         id_pengguna = userData.id_pengguna;
//       }
//     } catch (e) {
//       Alert.alert("Error", "Gagal mengambil data pengguna");
//       return;
//     }

//     if (!id_pengguna) {
//       Alert.alert("Error", "ID Pengguna tidak ditemukan");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", {
//       uri: image,
//       name: "bukti_izin.jpg",
//       type: "image/jpeg",
//     });

//     formData.append(
//       "izin",
//       JSON.stringify({
//         tanggal_awal: startDate.toISOString(),
//         tanggal_akhir: endDate.toISOString(),
//         jenis_izin: jenis,
//         id_pengguna: id_pengguna,
//         keterangan: keterangan,
//       })
//     );

//     try {
//       const res = await axios.post(API.IZIN, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       Alert.alert("Sukses", res.data.message);
//     } catch (err) {
//       Alert.alert("Error", "Gagal mengirim data absensi");
//     }
//     resetForm();
//   };

//   return (
//     <Modal
//       isVisible={visible}
//       onBackdropPress={onClose}
//       onSwipeComplete={onClose}
//       swipeDirection="down"
//       style={styles.modal}>
//       <View style={styles.container}>
//         {/* <View style={styles.topBar} /> */}
//         <View style={styles.modalHeader}>
//           <Text style={styles.title}>{t("form.title")}</Text>
//           {/* TODO ketika onPress menjadi tertutup. */}
//           <TouchableOpacity onPress={handleClose}>
//             <Ionicons name="close" size={24} color="#8E8E93" />
//           </TouchableOpacity>
//         </View>

//         <Text style={styles.label}>{t("form.jenis.title")}</Text>
//         <DropDownPicker
//           open={open}
//           value={jenis}
//           items={items}
//           setOpen={setOpen}
//           setValue={setJenis}
//           setItems={setItems}
//           style={styles.dropdown}
//           dropDownContainerStyle={styles.dropdownContainer}
//           placeholder={t("form.jenis.default")}
//         />

//         <Text style={styles.label}>{t("form.tglAwal")}</Text>
//         <TouchableOpacity style={styles.input} onPress={() => setShowStartPicker(true)}>
//           <Text>{formatDate(startDate)}</Text>
//         </TouchableOpacity>
//         {showStartPicker && (
//           <DateTimePicker
//             value={startDate}
//             mode="date"
//             display="default"
//             onChange={handleStartChange}
//             minimumDate={tomorrow}
//             maximumDate={endDate}
//           />
//         )}

//         <Text style={styles.label}>{t("form.tglAkhir")}</Text>
//         <TouchableOpacity style={styles.input} onPress={() => setShowEndPicker(true)}>
//           <Text>{formatDate(endDate)}</Text>
//         </TouchableOpacity>
//         {showEndPicker && (
//           <DateTimePicker
//             value={endDate}
//             mode="date"
//             display="default"
//             onChange={handleEndChange}
//             minimumDate={startDate}
//           />
//         )}

//         <Text style={styles.label}>{t("form.bukti")}</Text>
//         <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
//           {image ? (
//             <Image source={{ uri: image }} style={styles.image} />
//           ) : (
//             <Text style={{ color: "#fff" }}>{t("form.img")}</Text>
//           )}
//         </TouchableOpacity>

//         <Text style={styles.label}>Keterangan</Text>
//         <TextInput
//           style={styles.keteranganInput}
//           placeholder="Masukkan keterangan tambahan"
//           value={keterangan}
//           onChangeText={setKeterangan}
//           multiline
//           numberOfLines={4}
//         />
//         {/* Enhanced Action Buttons */}
//         <View style={styles.actionButtons}>
//           <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
//             <Text style={styles.cancelButtonText}>{t("form.btnClose")}</Text>
//           </TouchableOpacity>

//           <TouchableOpacity style={styles.submitButton} onPress={submitIzin}>
//             <Ionicons name="checkmark" size={20} color="#fff" />
//             <Text style={styles.submitText}>{t("form.btnConfirm")}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   modal: {
//     justifyContent: "flex-end",
//     margin: 0,
//   },
//   container: {
//     backgroundColor: "#fff",
//     padding: 24,
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//   },
//   topBar: {
//     height: 5,
//     width: 60,
//     backgroundColor: "#ccc",
//     borderRadius: 999,
//     alignSelf: "center",
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#1C1C1E",
//   },
//   label: {
//     fontSize: 14,
//     marginTop: 8,
//     marginBottom: 4,
//     color: "#2E7BE8",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: Platform.OS === "ios" ? 14 : 12,
//     marginBottom: 8,
//   },
//   dropdown: {
//     borderColor: "#ccc",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     marginBottom: 12,
//     zIndex: 1000,
//   },
//   dropdownContainer: {
//     borderColor: "#ccc",
//     zIndex: 1000,
//   },
//   imageBox: {
//     backgroundColor: "#999",
//     height: 100,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   image: {
//     width: "100%",
//     height: "100%",
//     borderRadius: 8,
//   },
//   submitButton: {
//     backgroundColor: "#2E7BE8",
//     paddingVertical: 14,
//     borderRadius: 999,
//     alignItems: "center",
//     marginTop: 16,
//   },
//   submitText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   keteranganInput: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     minHeight: 80,
//     textAlignVertical: "top",
//     marginBottom: 8,
//     backgroundColor: "#f9f9f9",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F2F2F7",
//   },
//   actionButtons: {
//     flexDirection: "row",
//     padding: 20,
//     gap: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#F2F2F7",
//   },
//   cancelButton: {
//     flex: 1,
//     backgroundColor: "#F2F2F7",
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#8E8E93",
//   },
//   submitButton: {
//     flex: 2,
//     backgroundColor: "#2E7BE8",
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     flexDirection: "row",
//     gap: 8,
//   },
// });
