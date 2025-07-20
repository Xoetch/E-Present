import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";
import API from "../utils/ApiConfig";

export default function CalendarWithHoliday({ holidays, onHolidaysChange }) {
  const [markedDates, setMarkedDates] = useState({});
  const [holidayInfo, setHolidayInfo] = useState("");

  // Fungsi untuk generate array tanggal dari rentang tanggal_mulai sampai tanggal_selesai
  const getDateRange = (start, end) => {
    const dates = [];
    let current = new Date(start);
    const last = new Date(end);
    while (current <= last) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch(API.GET_HOLIDAY);
        const json = await res.json();
        const items = json.data || [];
        if (onHolidaysChange) onHolidaysChange(items); // lifting state ke parent
        // Tandai tanggal libur nasional
        const marked = {};
        items.forEach((item) => {
          const range = getDateRange(item.tanggal_mulai, item.tanggal_selesai);
          range.forEach((date) => {
            marked[date] = {
              marked: true,
              dotColor: "red",
              selected: true,
              selectedColor: "#FF9898",
              customStyles: {
                text: { color: "red" },
              },
            };
          });
        });
        setMarkedDates(marked);
      } catch (error) {
        console.error("Gagal mengambil data libur:", error);
      }
    };
    // Hanya fetch jika holidays belum ada
    if (!holidays || holidays.length === 0) {
      fetchHolidays();
    } else {
      // Jika holidays sudah ada, langsung tandai
      const marked = {};
      holidays.forEach((item) => {
        const range = getDateRange(item.tanggal_mulai, item.tanggal_selesai);
        range.forEach((date) => {
          marked[date] = {
            marked: true,
            dotColor: "red",
            selected: true,
            selectedColor: "#FF9898",
            customStyles: {
              text: { color: "red" },
            },
          };
        });
      });
      setMarkedDates(marked);
    }
  }, [holidays]);

  const handleDayPress = (day) => {
    // Cari deskripsi libur untuk tanggal yang dipilih
    const found = holidays.find((item) => {
      const range = getDateRange(item.tanggal_mulai, item.tanggal_selesai);
      return range.includes(day.dateString);
    });
    setHolidayInfo(found ? found.deskripsi : "");
  };

  return (
    <View style={styles.container}>
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onMonthChange={() => setHolidayInfo("")} // reset info saat bulan diganti
        theme={{
          todayTextColor: "#2E7BE8",
          arrowColor: "#2E7BE8",
          textDayFontWeight: "500",
        }}
      />
      {holidayInfo ? (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{holidayInfo}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  infoBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fff6f6",
    borderRadius: 8,
    borderLeftColor: "red",
    borderLeftWidth: 4,
  },
  infoText: {
    color: "#cc0000",
    fontWeight: "600",
    fontSize: 14,
  },
});
