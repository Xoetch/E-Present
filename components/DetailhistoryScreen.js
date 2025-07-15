import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const DetailhistoryScreen = ({ visible, item, onClose }) => {
  const { t } = useTranslation();

  if (!item) return null;

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "null") return "-";
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.slice(0,5);
    return timeStr;
  };

  const handleOpenImage = (imageUrl) => {
    if (imageUrl && !imageUrl.includes("null")) {
      Linking.openURL(imageUrl).catch(err => console.error("Failed to open image:", err));
    }
  };

  const renderContentByStatus = () => {
    switch(item.status_kehadiran) {
      case "Hadir":
        return (
          <>
            <View style={styles.timeSection}>
              <View style={styles.timeCard}>
                <Ionicons name="time-outline" size={20} color="#4CAF50" />
                <Text style={styles.timeLabel}>{t("history.clockIn")}</Text>
                <Text style={styles.timeValue}>{formatTime(item.jam_masuk)}</Text>
              </View>

              <View style={styles.timeCard}>
                <Ionicons name="time-outline" size={20} color="#F44336" />
                <Text style={styles.timeLabel}>{t("history.clockOut")}</Text>
                <Text style={styles.timeValue}>{formatTime(item.jam_keluar)}</Text>
              </View>
            </View>

            <View style={styles.photoSection}>
              <Text style={styles.sectionTitle}>{t("history.photoEvidence")}</Text>
              
              {item.bukti_kehadiran && !item.bukti_kehadiran.includes("null") && (
                <TouchableOpacity onPress={() => handleOpenImage(item.bukti_kehadiran)}>
                  <View style={styles.photoContainer}>
                    <Image 
                      source={{ uri: item.bukti_kehadiran }} 
                      style={styles.photo} 
                      resizeMode="cover"
                    />
                    <Text style={styles.photoCaption}>{t("history.clockInPhoto")}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {item.bukti_kehadiran2 && !item.bukti_kehadiran2.includes("null") && (
                <TouchableOpacity onPress={() => handleOpenImage(item.bukti_kehadiran2)}>
                  <View style={styles.photoContainer}>
                    <Image 
                      source={{ uri: item.bukti_kehadiran2 }} 
                      style={styles.photo} 
                      resizeMode="cover"
                    />
                    <Text style={styles.photoCaption}>{t("history.clockOutPhoto")}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </>
        );
      
      case "Izin":
        return (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="document-text-outline" size={24} color="#FFA000" />
              <Text style={styles.infoText}>{item.keterangan || "Tidak ada keterangan"}</Text>
            </View>

            {item.bukti_kehadiran && !item.bukti_kehadiran.includes("null") && (
              <View style={styles.photoSection}>
                <Text style={styles.sectionTitle}>{t("history.izinEvidence")}</Text>
                <TouchableOpacity onPress={() => handleOpenImage(item.bukti_kehadiran)}>
                  <View style={styles.photoContainer}>
                    <Image 
                      source={{ uri: item.bukti_kehadiran }} 
                      style={styles.photo} 
                      resizeMode="cover"
                    />
                    <Text style={styles.photoCaption}>{t("history.izinPhoto")}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </>
        );
      
      default:
        return (
          <View style={styles.infoCard}>
            <Ionicons name="warning-outline" size={24} color="#F44336" />
            <Text style={styles.infoText}>Tidak hadir tanpa keterangan</Text>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Kehadiran</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.modalContent}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={24} color="#2E7BE8" />
              <Text style={styles.cardHeaderText}>{item.tanggal}</Text>
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: item.status_kehadiran === "Hadir" ? "#E8F5E9" : 
                                  item.status_kehadiran === "Izin" ? "#FFF8E1" : "#FFEBEE"
                }
              ]}>
                <Text style={[
                  styles.statusText,
                  { 
                    color: item.status_kehadiran === "Hadir" ? "#4CAF50" : 
                          item.status_kehadiran === "Izin" ? "#FFA000" : "#F44336"
                  }
                ]}>
                  {item.status_kehadiran}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shift Kerja:</Text>
              <Text style={styles.detailValue}>{item.shift_kerja || "-"}</Text>
            </View>

            {renderContentByStatus()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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

