import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";


// Screens
import * as SplashScreen from 'expo-splash-screen';
import LoginScreen from "./components/LoginScreen";
import HomeScreen from "./components/HomeScreen";
import HistoryScreen from "./components/HistoryScreen";
import ProfileScreen from "./components/ProfileScreen";
import CameraScreen from "./components/CameraScreen";
import FormizinScreen from "./components/FormizinScreen";
import { StatusBar } from "expo-status-bar";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2E7BE8',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Riwayat') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 4 },
        tabBarStyle: {
          height: 60 + insets.bottom,
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
