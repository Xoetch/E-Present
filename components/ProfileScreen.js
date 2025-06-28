import React, { use, useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function ProfileScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState("https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg");
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const [userData, setUserData] = useState({
    nama_lengkap: "",
    alamat_lengkap: "",
    jam_shift: "",
    foto_pengguna: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const dataString = await AsyncStorage.getItem('userData');
        if (dataString) {
          const data = JSON.parse(dataString);
          setUserData({
            nama_lengkap: data.nama_lengkap || "",
            alamat_lengkap: data.alamat_lengkap || "",
            jam_shift: data.jam_shift || "",
            foto_pengguna: data.foto_pengguna || "",
          });
        }
      } catch (e) {
        console.log('Gagal mengambil userData:', e);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => { 
    const handleLanguageChange = (lng) => {
      setCurrentLang(lng);
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const handleLanguageChange = async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      setCurrentLang(langCode);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  }
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
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

      <Text style={styles.nameText}>{userData.nama_lengkap}</Text>

      <View style={styles.infoCard}>
        {/* <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>{t('profile.name')}</Text>
            <Text style={styles.value}>Mas Altap</Text>
          </View>
        </View> */}
        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>{t('profile.workplace')}</Text>
            <Text style={styles.value}>{userData.alamat_lengkap || "Astra International"}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>{t('profile.shift')}</Text>
            <Text style={styles.value}>{userData.jam_shift || "Pagi (08:00 - 16:00)"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.languageCard}>
        <Text style={styles.languageTitle}>🌐 {t('profile.Localization')}</Text>
        <View style={styles.languageButtons}>
          <TouchableOpacity
            style={[styles.languageButton, currentLang === "en" && styles.languageSelected]}
            onPress={() => handleLanguageChange("en")}
          >
            <Text style={[styles.languageText, currentLang === "en" && styles.languageTextSelected]}>
              {t('profile.eng')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageButton, currentLang === "id" && styles.languageSelected]}
            onPress={() => handleLanguageChange("id")}
          >
            <Text style={[styles.languageText, currentLang === "id" && styles.languageTextSelected]}>
              {t('profile.ind')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 {t('profile.logout')}</Text>
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