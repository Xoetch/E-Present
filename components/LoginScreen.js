import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const formPosition = useRef(new Animated.Value(0)).current;

  const { t, i18n } = useTranslation();

  const [fontsLoaded] = useFonts({
    'RobotoCondensed-ExtraBoldItalic': require('../assets/fonts/Roboto_Condensed/static/RobotoCondensed-ExtraBoldItalic.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7BE8" />
        <Text style={{ marginTop: 8 }}>Loading fonts...</Text>
      </View>
    );
  }

  const handleLogin = () => {
    if (email && password) {
      Animated.timing(formPosition, {
        toValue: 1000, 
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('MainTabs');
      });
    } else {
      alert('Username dan password tidak boleh kosong!');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'padding' : 'height'}
        style={styles.container} >
          <View style={styles.container}>
            <ImageBackground
              source={require('../assets/background.png')}
              style={styles.image}
              resizeMode="cover"
            >
              <Animated.View style={[styles.formContainer, { transform: [{ translateY: formPosition }] }]}>
                <Text style={styles.welcome}>{t('login.title')}</Text>

                <TextInput
                  placeholder={t('login.username')}
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder={t('login.password')}
                    placeholderTextColor="#999"
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={secureText}
                  />
                  <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                    <Ionicons
                      name={secureText ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity>
                <Text style={styles.forgot}>{ t('login.forgor') }</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginText}>{ t('login.login') }</Text>
                </TouchableOpacity>
              </Animated.View>
            </ImageBackground>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 48,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
  },
  forgot: {
    color: '#2E7BE8',
    alignSelf: 'flex-start',
    marginBottom: 16,
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: '#2E7BE8',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});