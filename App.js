import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./locales/i18n";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  useSafeAreaInsets,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View, ActivityIndicator } from "react-native";

// Screens
import LoginScreen from "./components/LoginScreen";
import HomeScreen from "./components/HomeScreen";
import HistoryScreen from "./components/HistoryScreen";
import ProfileScreen from "./components/ProfileScreen";
import CameraScreen from "./components/CameraScreen";
import FormizinScreen from "./components/FormizinScreen";
import resultModal from "./components/ResultModal";
import LocationMapScreen from "./components/LocationMapScreen";
import Loading from "./components/SplashScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({ onLogout }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2E7BE8",
        tabBarInactiveTintColor: "gray",
        tabBarPressColor: "transparent",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "History") {
            iconName = focused ? "time" : "time-outline";
          } else if (route.name === "Profile") {
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t("bar.home") }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarLabel: t("bar.history") }}
      />
      <Tab.Screen
        name="Profile"
        children={() => <ProfileScreen onLogout={onLogout} />}
        options={{ tabBarLabel: t("bar.profile") }}
      />
    </Tab.Navigator>
  );
}


export default function App() {
  const [fontsLoaded] = useFonts({
    
  });

  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t } = useTranslation();

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

useEffect(() => {
  const loadApp = async () => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      setIsLoggedIn(true);
    }

    setTimeout(() => {
      setIsAppLoading(false);
    }, 2000); 
  };

  loadApp();
}, []);


  useEffect(() => {
    if (fontsLoaded) {
      Text.defaultProps = Text.defaultProps || {};
      Text.defaultProps.style = [{ fontFamily: "InriaSans-Regular" }];
    }
  }, [fontsLoaded]);

  if (isAppLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <Stack.Screen name="Login">
              {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs">
                {() => <MainTabs onLogout={() => setIsLoggedIn(false)} />}
              </Stack.Screen>
              <Stack.Screen name="CameraScreen" component={CameraScreen} />
              <Stack.Screen name="FormIzinScreen" component={FormizinScreen} />
              {/* <Stack.Screen name="ResultModal" component={resultModal} /> */}
              <Stack.Screen name="LocationMap" component={LocationMapScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

