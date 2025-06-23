import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

// GANTI dengan API KEY dari Google Cloud Console kamu
const API_KEY = "AIzaSyASdAnPyCeRCUpdpU4BcVKMI9G4xlx1wvA"; 
const CALENDAR_ID = "id.indonesian%23holiday@group.v.calendar.google.com";

export default function CalendarWithHoliday() {
  const [markedDates, setMarkedDates] = useState({});
  const [holidayInfo, setHolidayInfo] = useState("");
  const [events, setEvents] = useState([]);

  const fetchGoogleHolidays = async (year, month) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const timeMin = `${year}-${String(month).padStart(2, "0")}-01T00:00:00Z`;
    const timeMax = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}T23:59:59Z`;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      const items = data.items || [];
      setEvents(items);

      const marked = {};
      const today = new Date().toISOString().split("T")[0];

      // Tandai libur nasional
      items.forEach((item) => {
        const date = item.start.date;
        marked[date] = {
          marked: true,
          dotColor: "red",
          selected: true,
          selectedColor: "#FF9898",
        };
      });

      // Tandai semua hari Minggu (jika belum ditandai sebagai libur nasional)
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month - 1, d);
        const isoDate = dateObj.toISOString().split("T")[0];
        if (dateObj.getDay() === 0 && !marked[isoDate]) {
          marked[isoDate] = {
            customStyles: {
              text: { color: "red" },
            },
          };
        }
      }

      // Tandai hari ini
      const todayDate = new Date();
      const currentMonth = todayDate.getMonth() + 1;
      const currentYear = todayDate.getFullYear();
      const isoToday = todayDate.toISOString().split("T")[0];

      if (year === currentYear && month === currentMonth) {
        marked[isoToday] = {
          ...(marked[isoToday] || {}),
          selected: true,
          selectedColor: "#9be29b",
        };
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error("Gagal mengambil data dari Google Calendar API", error);
    }
  };

  useEffect(() => {
    const today = new Date();
    fetchGoogleHolidays(today.getFullYear(), today.getMonth() + 1);
  }, []);

  const handleMonthChange = (months) => {
    if (months && months.length > 0) {
      const y = parseInt(months[0].year);
      const m = parseInt(months[0].month);
      fetchGoogleHolidays(y, m);
    }
  };

  const handleDayPress = (day) => {
    const found = events.find((e) => e.start.date === day.dateString);
    setHolidayInfo(found ? found.summary : "");
  };

  return (
    <View style={styles.container}>
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        onVisibleMonthsChange={handleMonthChange}
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
