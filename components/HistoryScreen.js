import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const attendanceData = [
  { id: "1", type: "Masuk Kerja", time: "09:00 AM", date: "2024-01-14" },
  { id: "2", type: "Masuk Kerja", time: "09:00 AM", date: "2024-01-14" },
  { id: "3", type: "Masuk Kerja", time: "09:00 AM", date: "2024-01-14" },
  { id: "4", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "5", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "6", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "7", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "8", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "9", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "11", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "12", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "13", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "14", type: "Pulang Kerja", time: "05:00 PM", date: "2024-01-14" },
  { id: "15", type: "Masuk Kerja", time: "05:00 AM", date: "2024-01-14" },
];

export default function HistoryScreen() {
  const [month, setMonth] = useState("Desember");

  const renderItem = ({ item }) => {
    const isMasuk = item.type === "Masuk Kerja";
    return (
      <View style={styles.itemContainer}>
        <View
          style={[
            styles.circleIcon,
            { backgroundColor: isMasuk ? "#4CAF50" : "#F44336" },
          ]}
        >
          <Ionicons name="time" size={18} color="#fff" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.typeText}>{item.type}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
        <Text
          style={[styles.timeText, { color: isMasuk ? "#4CAF50" : "#F44336" }]}
        >
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Bulan */}
      <View style={styles.header}>
        <View style={styles.monthSwitcher}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="caret-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.monthContainer}>
            <Text style={styles.monthText}>{month}</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="caret-forward-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Kontainer isi */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Riwayat Absensi</Text>
        <FlatList
          data={attendanceData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E7BE8",
  },
  header: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 10,
  },
  monthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 32,
    width: 335,
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  iconButton: {
    backgroundColor: "#2E7BE8",
    borderRadius: 20,
    padding: 8,
  },
  monthContainer: {
    backgroundColor: "#2E7BE8",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: 134,
    height: 44,
    alignItems: "center",
  },
  monthText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6B7280",
    alignSelf: "center",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  circleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  dateText: {
    fontSize: 13,
    color: "#777",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "bold",
  },
});
