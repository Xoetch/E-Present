import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [image, setImage] = useState("https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg");
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
          console.log(data.foto_pengguna);
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
            navigation.replace("Login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Gagal logout");
          }
        },
      },
    ]);
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
      const res = await axios.post("http://10.1.51.153:8080/user/updateProfilePic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data && res.data.data) {
        const updatedData = res.data.data;
        const newUserData = {
          ...userData,
          foto_pengguna: `http://10.1.51.153:8080/user/foto/${updatedData.foto_pengguna}`,
        };
        await AsyncStorage.setItem("userData", JSON.stringify(newUserData));
        setUserData(newUserData);

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
    <View style={styles.container}>
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

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="business" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>{t("profile.workplace")}</Text>
            <Text style={styles.value}>{userData.alamat_lengkap || "Astra International"}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color="#888" style={styles.icon} />
          <View>
            <Text style={styles.label}>{t("profile.shift")}</Text>
            <Text style={styles.value}>{userData.jam_shift || "Pagi (08:00 - 16:00)"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.languageCard}>
        <View style={styles.languageHeader}>
          <Ionicons name="globe-outline" size={20} color="#888" style={styles.icon} />
          <Text style={styles.languageTitle}>{t("profile.Localization")}</Text>
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
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  languageTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
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
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    flexDirection: "row",
    justifyContent: "center",
  },
  logoutText: { color: "red", fontWeight: "bold" },
});
