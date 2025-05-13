import { View, Text, TextInput, Button, StyleSheet, Alert, useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getLoginText } from '../utils/language';
import { API_BACKEND } from '@/utils/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: isDarkMode ? '#000' : '#fff',
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      textAlign: 'center',
      color: isDarkMode ? '#fff' : '#000',
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#555' : '#ccc',
      padding: 10,
      marginBottom: 10,
      borderRadius: 5,
      color: isDarkMode ? '#fff' : '#000',
      backgroundColor: isDarkMode ? '#333' : '#fff',
    },
  });

  const [text, setText] = useState(getLoginText('TR'));

  useEffect(() => {
    const fetchLanguage = async () => {
      const language = await AsyncStorage.getItem('language');
      setText(getLoginText(language === 'EN' ? 'EN' : 'TR'));
    };
    fetchLanguage();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post(API_BACKEND+'/api/auth/login', {
        username,
        password,
      });

      const token = response.data as string;
      await AsyncStorage.setItem('jwtToken', token);
      Alert.alert(text.loginSuccess);
      router.back();
    } catch (err) {
      Alert.alert(text.loginError, text.invalidCredentials);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{text.loginMessage}</Text>
      <TextInput
        placeholder={text.loginPlaceholder}
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        placeholder={text.passwordPlaceholder}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={text.loginButton} onPress={handleLogin} />
    </View>
  );
}