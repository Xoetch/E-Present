import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import './locales/i18n';
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Text, View, ActivityIndicator } from "react-native";

// Screens
import LoginScreen from "./components/LoginScreen";
import HomeScreen from "./components/HomeScreen";
import HistoryScreen from "./components/HistoryScreen";
import ProfileScreen from "./components/ProfileScreen";
import CameraScreen from "./components/CameraScreen";
import FormizinScreen from "./components/FormizinScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2E7BE8",
        tabBarInactiveTintColor: "gray",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Riwayat") {
            iconName = focused ? "time" : "time-outline";
          } else if (route.name === "Profil") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 4 },
        tabBarStyle: {
          height: 75 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Riwayat" component={HistoryScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "InriaSans-Regular": require("./assets/fonts/Inria_Sans/InriaSans-Regular.ttf"),
    "InriaSans-Bold": require("./assets/fonts/Inria_Sans/InriaSans-Bold.ttf"),
    "InriaSans-Italic": require("./assets/fonts/Inria_Sans/InriaSans-Italic.ttf"),
    "InriaSans-BoldItalic": require("./assets/fonts/Inria_Sans/InriaSans-BoldItalic.ttf"),
  });

  const {t, i18n} = useTranslation();

  useEffect(() => {
    if (fontsLoaded) {
      const defaultText = Text;
      defaultText.defaultProps = defaultText.defaultProps || {};
      defaultText.defaultProps.style = [
        defaultText.defaultProps.style,
        { fontFamily: "InriaSans-Regular" },
      ];
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2E7BE8" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="CameraScreen" component={CameraScreen} />
          <Stack.Screen name="FormIzinScreen" component={FormizinScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
