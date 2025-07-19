import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API from "../utils/ApiConfig";

export default function ProfileScreen({ onLogout }) {
  const navigation = useNavigation();
  const [image, setImage] = useState("");
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const [userData, setUserData] = useState({
    id_pengguna: null,
    nama_lengkap: "",
    alamat_lengkap: "",
    jam_shift: "",
    foto_pengguna: "",
  });

  useEffect(() => {
    console.log("onLogout exists?", typeof onLogout);

    const fetchUserData = async () => {
      try {
        const dataString = await AsyncStorage.getItem("userData");
        if (dataString) {
          const data = JSON.parse(dataString);
          setUserData({
            id_pengguna: data.id_pengguna,
            nama_lengkap: data.nama_lengkap || "",
            alamat_lengkap: data.alamat_lengkap || "",
            jam_shift: data.jam_shift || "",
            foto_pengguna: data.foto_pengguna,
          });

          if (data.foto_pengguna) {
            setImage(data.foto_pengguna);
          }
        }
      } catch (e) {
        console.log("Gagal mengambil userData:", e);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLang(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  const handleLanguageChange = async (langCode) => {
    try {
      await i18n.changeLanguage(langCode);
      setCurrentLang(langCode);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      await updateProfilePic(uri);
    }
  };

  const handleLogout = async () => {
    Alert.alert(t("profile.Konfirmasi"), null, [
      {
        text: t("general.no"),
        style: "cancel",
      },
      {
        text: t("general.yes"),
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["userToken", "userData"]);
            onLogout(); // <-- kembalikan ke login screen
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Gagal logout");
          }
        },
      },
    ]);
  };

  // Helper function to construct correct image URL
  const constructImageUrl = (imagePath) => {
    if (!imagePath) return "";
    // If it's already a full URL, extract just the path part
    if (imagePath.includes("http")) {
      const url = new URL(imagePath);
      return `${API.BASE_URL}${url.pathname}`;
    }
    // If it's just a path, construct the full URL
    if (imagePath.startsWith("/")) {
      return `${API.BASE_URL}${imagePath}`;
    }
    // If it's just a filename, assume it's in uploads folder
    return `${API.BASE_URL}/uploads/${imagePath}`;
  };

  const updateProfilePic = async (uri) => {
    let id_pengguna = null;

    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const data = JSON.parse(userDataString);
        id_pengguna = data.id_pengguna;
      }
    } catch (error) {
      Alert.alert("Error", "Gagal mengambil data pengguna");
    }

    if (!id_pengguna) {
      Alert.alert("Error", "Id pengguna tidak ditemukan!");
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    formData.append("id", id_pengguna);

    try {
      const res = await axios.post(API.PROFILE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data && res.data.data) {
        const updatedData = res.data.data;

        // Fix the image URL to use correct base URL
        const correctedImageUrl = constructImageUrl(updatedData.foto_pengguna);

        const newUserData = {
          ...userData,
          foto_pengguna: correctedImageUrl,
        };

        await AsyncStorage.setItem("userData", JSON.stringify(newUserData));
        setUserData(newUserData);
        setImage(correctedImageUrl);

        const verifyData = await AsyncStorage.getItem("userData");
        console.log("✅ AsyncStorage updated:", JSON.parse(verifyData));
        Alert.alert("Sukses", res.data.message);
      }
    } catch (e) {
      console.error("ERROR: " + e);
      Alert.alert("Error", "Gagal update profile pics");
    }
  };

  return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header} />

      <View style={styles.profileWrapper}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.profileImage} />
          <TouchableOpacity style={styles.cameraIcon} onPress={pickImage} activeOpacity={0.8}>
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.nameText}>{userData.nama_lengkap}</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t("home.calendar")}</Text>
          <View style={styles.cardTitleUnderline} />
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>{t("profile.address")}</Text>
            <Text style={styles.value}>{userData.alamat_lengkap || "Astra International"}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>{t("profile.shift")}</Text>
            <Text style={styles.value}>{userData.jam_shift || "09:00 - 17:00"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t("profile.Localization")}</Text>
          <View style={styles.cardTitleUnderline} />
        </View>
        <View style={styles.languageButtons}>
          <TouchableOpacity
            style={[styles.languageButton, currentLang === "en" && styles.languageSelected]}
            onPress={() => handleLanguageChange("en")}
            activeOpacity={0.8}>
            <View style={styles.languageButtonContent}>
              <Text style={styles.languageFlag}>🇺🇸</Text>
              <Text style={[styles.languageText, currentLang === "en" && styles.languageTextSelected]}>
                {t("profile.eng")}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.languageButton, currentLang === "id" && styles.languageSelected]}
            onPress={() => handleLanguageChange("id")}
            activeOpacity={0.8}>
            <View style={styles.languageButtonContent}>
              <Text style={styles.languageFlag}>🇮🇩</Text>
              <Text style={[styles.languageText, currentLang === "id" && styles.languageTextSelected]}>
                {t("profile.ind")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="red" style={styles.icon} />
        <Text style={styles.logoutText}>{t("profile.logout")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2E7BE8",
    height: 125,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileWrapper: {
    alignItems: "center",
    marginTop: -60,
    zIndex: 10,
  },
  imageContainer: {
    position: "relative",
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  cardTitleUnderline: {
    height: 3,
    width: 30,
    backgroundColor: "#2E7BE8",
    borderRadius: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  icon: { marginRight: 12 },
  label: { fontSize: 13, color: "#777" },
  value: { fontSize: 16, fontWeight: "bold", color: "#444" },
  languageButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  languageButton: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: "center",
  },
  languageSelected: { backgroundColor: "#2E7BE8" },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  languageFlag: {
    fontSize: 16,
  },
  languageText: { fontWeight: "bold", color: "#888" },
  languageTextSelected: { color: "#fff" },
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  logoutText: { color: "red", fontWeight: "bold" },
});
