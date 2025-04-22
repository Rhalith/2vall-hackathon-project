import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, TextInput, Button, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getLanguageText } from '../../utils/language';
import { isUserLoggedIn, logout } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReportCard from '../components/ReportCard';
import { Report } from '../../types/Report';
import axios from 'axios';

export default function HomeScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [language, setLanguage] = useState<'TR' | 'EN'>('TR');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  const text = getLanguageText(language);

  useEffect(() => {
    loadLanguage();
    loadReportsFromStorage();
    checkLoginStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkLoginStatus();
      checkForNewReports();
    }, [])
  );

  const loadLanguage = async () => {
    const storedLang = await AsyncStorage.getItem('language');
    if (storedLang === 'TR' || storedLang === 'EN') {
      setLanguage(storedLang);
    }
  };

  const checkLoginStatus = async () => {
    const loggedIn = await isUserLoggedIn();
    setUserLoggedIn(loggedIn);
  };

  const loadReportsFromStorage = async () => {
    const stored = await AsyncStorage.getItem('reports');
    if (stored) {
      const parsed = JSON.parse(stored);
      setReports(parsed);
      setFilteredReports(parsed);
    }
  };

  const checkForNewReports = async () => {
    try {
      const response = await axios.get<Report[]>('http://172.26.200.127:8080/api/reports');
      const freshData = response.data;

      const stored = await AsyncStorage.getItem('reports');
      const existing: Report[] = stored ? JSON.parse(stored) : [];

      if (JSON.stringify(existing) !== JSON.stringify(freshData)) {
        await AsyncStorage.setItem('reports', JSON.stringify(freshData));
        setReports(freshData);
        setFilteredReports(freshData);
      }
    } catch (err) {
      console.error(text.fetchError);
    }
  };

  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
    const filtered = reports.filter((r) =>
      r.locationHierarchy.toLowerCase().includes(query)
    );
    setFilteredReports(filtered);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await axios.patch(`http://172.26.200.127:8080/api/reports/updateStatus/${id}`, {
        newStatus,
      });

      const updatedReport = response.data as Report;

      const updatedReports = reports.map(r => r.id === id ? { ...r, status: updatedReport.status } : r);
      setReports(updatedReports);
      setFilteredReports(updatedReports);
      await AsyncStorage.setItem('reports', JSON.stringify(updatedReports));

      Alert.alert(text.updateSuccess);
    } catch (error) {
      console.error(text.updateError);
    }
  };

  const handleLanguageSwitch = async () => {
    const newLanguage = language === 'TR' ? 'EN' : 'TR';
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <View style={{ marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button title={text.languageSwitch || 'Dil Değiştir'} onPress={handleLanguageSwitch} />
        {userLoggedIn ? (
          <Button title={text.logout} onPress={() => { logout(); setUserLoggedIn(false); }} />
        ) : (
          <Button title={text.login} onPress={() => router.push('/login')} />
        )}
      </View>

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        {text.welcome}
      </Text>

      <TextInput
        placeholder={text.searchPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
      />
      <Button title={text.sortByVictims} onPress={handleSearch} />

      <View style={{ marginTop: 16 }}>
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            address={report.locationHierarchy}
            victimCount={report.victimCount}
            status={report.status}
            tweet={report.tweet}
            coordinates={report.coordinates}
            phoneNumber={report.phoneNumber}
            needs={report.needs}
            isDroneValidated={report.isDroneValidated}
            language={language}
            userLoggedIn={userLoggedIn}
            onUpdateStatus={userLoggedIn ? (newStatus) => handleUpdateStatus(report.id, newStatus) : () => {}}
          />
        ))}
      </View>
    </ScrollView>
  );
}