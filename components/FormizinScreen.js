import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Button,
} from "react-native";
import Modal from "react-native-modal";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";

export default function FormizinPopup({ visible, onClose }) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [jenis, setJenis] = useState(null);
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const [items, setItems] = useState([]);
  const [image, setImage] = useState(null);

  useEffect(() => {
    setItems([
      { label: t("form.jenis.sakit"), value: "sakit" },
      { label: t("form.jenis.izin"), value: "izin" },
      { label: t("form.jenis.cuti"), value: "cuti" },
    ]);
  }, [t, i18n.language]);

  const resetForm = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setShowStartPicker(false);
    setShowEndPicker(false);
    setJenis(null);
    setOpen(false);
    setImage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const formatDate = (date) =>
    date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.topBar} />
        <Text style={styles.title}>{t("form.title")}</Text>

        <Text style={styles.label}>{t("form.tglAwal")}</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowStartPicker(true)}
        >
          <Text>{formatDate(startDate)}</Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartChange}
            maximumDate={endDate}
          />
        )}

        <Text style={styles.label}>{t("form.tglAkhir")}</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowEndPicker(true)}
        >
          <Text>{formatDate(endDate)}</Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={handleEndChange}
            minimumDate={startDate}
          />
        )}

        <Text style={styles.label}>{t("form.jenis.title")}</Text>
        <DropDownPicker
          open={open}
          value={jenis}
          items={items}
          setOpen={setOpen}
          setValue={setJenis}
          setItems={setItems}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          placeholder={t("form.jenis.default")}
        />

        <Text style={styles.label}>{t("form.bukti")}</Text>
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <Text style={{ color: "#fff" }}>{t("form.img")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitText}>{t("form.btnConfirm")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClose}
          style={{ marginTop: 12, alignSelf: "center" }}
        >
          <Text style={{ color: "#2E7BE8" }}>{t("form.btnClose")}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  topBar: {
    height: 5,
    width: 60,
    backgroundColor: "#ccc",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#6B7280",
  },
  label: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    color: "#2E7BE8",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    marginBottom: 8,
  },
  dropdown: {
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    zIndex: 1000,
  },
  dropdownContainer: {
    borderColor: "#ccc",
    zIndex: 1000,
  },
  imageBox: {
    backgroundColor: "#999",
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: "#2E7BE8",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 16,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },
});