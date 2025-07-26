import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import "./locales/i18n";

// Screens
import CameraScreen from "./components/CameraScreen";
import FormizinScreen from "./components/FormizinScreen";
import HistoryScreen from "./components/HistoryScreen";
import HomeScreen from "./components/HomeScreen";
import LocationMapScreen from "./components/LocationMapScreen";
import LoginScreen from "./components/LoginScreen";
import ProfileScreen from "./components/ProfileScreen";
import Loading from "./components/SplashScreen";
import { AlertProvider } from "./utils/CustomAlert";

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
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t("bar.home") }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: t("bar.history") }} />
      <Tab.Screen
        name="Profile"
        children={() => <ProfileScreen onLogout={onLogout} />}
        options={{ tabBarLabel: t("bar.profile") }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({});

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
      <AlertProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isLoggedIn ? (
              <Stack.Screen name="Login">{() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}</Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="MainTabs">{() => <MainTabs onLogout={() => setIsLoggedIn(false)} />}</Stack.Screen>
                <Stack.Screen name="CameraScreen" component={CameraScreen} />
                <Stack.Screen name="FormIzinScreen" component={FormizinScreen} />
                {/* <Stack.Screen name="ResultModal" component={resultModal} /> */}
                <Stack.Screen name="LocationMap" component={LocationMapScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
