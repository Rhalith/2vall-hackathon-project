import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  roles: string[];
  [key: string]: any;
}

export async function isUserLoggedIn(): Promise<boolean> {
  const token = await AsyncStorage.getItem('jwtToken');
  if (!token) return false;
  try {
    jwtDecode<DecodedToken>(token);
    return true;
  } catch (err) {
    console.log('Token is invalid:', err);
    return false;
  }
}

export async function getUserRoles(): Promise<string[] | null> {
  const token = await AsyncStorage.getItem('jwtToken');
  if (!token) return null;
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.roles || null;
  } catch (err) {
    console.log('Error decoding token:', err);
    return null;
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem('jwtToken');
}