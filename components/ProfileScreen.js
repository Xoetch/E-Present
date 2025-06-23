import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native"; // ✅
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const navigation = useNavigation(); // ✅
  const [language, setLanguage] = useState("Indonesia");
  const [image, setImage] = useState("https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg");

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    // 🚪 Kembali ke halaman Login
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header} />

      <View style={styles.profileWrapper}>
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: image }} style={styles.profileImage} />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.nameText}>Kaiser Wilhelm Althafazu</Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>Profil Pekerja</Text>
            <Text style={styles.value}>Mas Altap</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>Tempat Bekerja</Text>
            <Text style={styles.value}>Astra International</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>Shift Kerja Hari Ini</Text>
            <Text style={styles.value}>Pagi (08:00 - 16:00)</Text>
          </View>
        </View>
      </View>

      <View style={styles.languageCard}>
        <Text style={styles.languageTitle}>🌐 Pengaturan Bahasa</Text>
        <View style={styles.languageButtons}>
          <TouchableOpacity
            style={[styles.languageButton, language === "English" && styles.languageSelected]}
            onPress={() => setLanguage("English")}
          >
            <Text style={[styles.languageText, language === "English" && styles.languageTextSelected]}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageButton, language === "Indonesia" && styles.languageSelected]}
            onPress={() => setLanguage("Indonesia")}
          >
            <Text style={[styles.languageText, language === "Indonesia" && styles.languageTextSelected]}>
              Indonesia
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2E7BE8",
    height: 175,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileWrapper: {
    alignItems: "center",
    marginTop: -60,
    zIndex: 10,
  },
  profileImage: {
    width: 182,
    height: 172,
    borderRadius: 20,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#2E7BE8",
    borderRadius: 20,
    padding: 6,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2E7BE8",
    marginVertical: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: { marginRight: 12 },
  label: { fontSize: 13, color: "#777" },
  value: { fontSize: 16, fontWeight: "bold", color: "#444" },
  languageCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    elevation: 2,
    marginBottom: 16,
  },
  languageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#444",
  },
  languageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  languageButton: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
  },
  languageSelected: { backgroundColor: "#2E7BE8" },
  languageText: { fontWeight: "bold", color: "#888" },
  languageTextSelected: { color: "#fff" },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
  },
  logoutText: { color: "red", fontWeight: "bold" },
});
