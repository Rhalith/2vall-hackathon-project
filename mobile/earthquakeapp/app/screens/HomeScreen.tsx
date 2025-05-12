import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, TextInput, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router, useFocusEffect } from 'expo-router';
import { getLanguageText } from '../../utils/language';
import { isUserLoggedIn, logout } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReportCard from '../components/ReportCard';
import { Report } from '../../types/Report';
import axios from 'axios';
import { COLORS } from '@/utils/colors';

export default function HomeScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [language, setLanguage] = useState<'TR' | 'EN'>('TR');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [onlyDroneValidated, setOnlyDroneValidated] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortDirection, setSortDirection] = useState('asc');



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
    const timestamp = await AsyncStorage.getItem('reportsTimestamp');

    if (stored) {
      const parsed = JSON.parse(stored);
      setReports(parsed);
      setFilteredReports(parsed);

      if (timestamp) {
        setLastUpdated(new Date(timestamp));
      }
    }
  };


  const applyFilters = () => {
    const query = searchQuery.toLowerCase();

    const filtered = reports.filter((r) => {
      const statusMatch =
        statusFilters.length === 0 ||
        statusFilters.includes(r.status);

      const droneMatch = !onlyDroneValidated || r.isDroneValidated;

      return (
        r.locationHierarchy.toLowerCase().includes(query) &&
        (region === '' || r.region === region) &&
        (district === '' || r.district === district) &&
        (neighborhood === '' || r.neighborhood === neighborhood) &&
        statusMatch &&
        droneMatch
      );
    });

    setFilteredReports(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, region, district, neighborhood, statusFilters, onlyDroneValidated]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewReports();
    }, 10 * 60 * 1000); // every 10 minutes

    return () => clearInterval(interval);
  }, []);


  const checkForNewReports = async () => {
    try {
      setIsRefreshing(true);
      const response = await axios.get<any[]>('http://192.168.1.144:8080/api/reports'); // Replace with your backend URL
      const rawReports = response.data;

      console.log('Fetched reports:', rawReports);
      // Parse backend short property format
      const parsed = rawReports.map((report: any) => {
        const parts = report.a?.split(' ') || [];

        let region = '';
        let district = '';
        let neighborhood = '';

        if (parts.length >= 2) {
          region = parts[0];
          district = parts[1];
          neighborhood = parts[2]
        }

        return {
          id: report._id?.$oid || '',
          address: report.a,
          tweet: report.t,
          victimCount: report.v,
          status: report.s,
          isDroneValidated: report.d,
          coordinates: {
            latitude: String(report.c?.lat ?? ''),
            longitude: String(report.c?.lng ?? ''),
          },
          phoneNumber: report.ct?.p || '',
          needs: report.ct?.n || '',
          region,
          district,
          neighborhood,
          locationHierarchy: report.a,
        };
      });

      const stored = await AsyncStorage.getItem('reports');
      const existing = stored ? JSON.parse(stored) : [];

      if (JSON.stringify(existing) !== JSON.stringify(parsed)) {
        await AsyncStorage.setItem('reports', JSON.stringify(parsed));
        setReports(parsed);
        await AsyncStorage.setItem('reportsTimestamp', new Date().toISOString());
        setLastUpdated(new Date());
        setFilteredReports(parsed);
      }
    } catch (err) {
      console.error(text.fetchError);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSortByVictims = () => {
    const sortedReports = [...filteredReports].sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.victimCount - b.victimCount; // Ascending sort
      } else {
        return b.victimCount - a.victimCount; // Descending sort
      }
    });
    setFilteredReports(sortedReports);
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); // Toggle sorting direction
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

      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        {text.welcome}
      </Text>
      {lastUpdated && (
        <Text style={{ fontSize: 12, color: '#555', marginBottom: 10, textAlign: 'center' }}>
          {language === 'TR' ? 'Son güncelleme: ' : 'Last updated: '}
          {lastUpdated.toLocaleString(language === 'TR' ? 'tr-TR' : 'en-US')}
        </Text>
      )}

      {isRefreshing && (
        <Text style={{ fontSize: 12, color: '#555', marginBottom: 10 }}>
          {text.dataUpdating || 'Veriler güncelleniyor...'}
        </Text>
      )}
      <TextInput
        placeholder={text.searchPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
      />
      <View style={{
        marginTop: 10,
        backgroundColor: '#f3f4f6',
        marginBottom: 8
      }}>
        <Picker selectedValue={region} onValueChange={setRegion} style={{ backgroundColor: '#f2f2f2', marginBottom: 8 }}>
          <Picker.Item label="İl Seç" value="" />
          {[...new Set(reports.map(r => r.region))].map(r =>
            <Picker.Item key={r} label={r} value={r} />
          )}
        </Picker>

        <Picker selectedValue={district} onValueChange={setDistrict} style={{ backgroundColor: '#f2f2f2', marginBottom: 8 }}>
          <Picker.Item label="İlçe Seç" value="" />
          {[...new Set(reports.filter(r => r.region === region).map(r => r.district))].map(d =>
            <Picker.Item key={d} label={d} value={d} />
          )}
        </Picker>

        <Picker selectedValue={neighborhood} onValueChange={setNeighborhood} style={{ backgroundColor: '#f2f2f2' }}>
          <Picker.Item label="Mahalle Seç" value="" />
          {[...new Set(reports.filter(r => r.district === district).map(r => r.neighborhood))].map(n =>
            <Picker.Item key={n} label={n} value={n} />
          )}
        </Picker>
      </View>

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 6,
        backgroundColor: '#f3f4f6',
        marginBottom: 8
      }}>
        {['Yardım Bekliyor', 'Gidildi', 'Asılsız'].map(status => (
          <Button
            key={status}
            title={status}
            onPress={() =>
              setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])
            }
            color={statusFilters.includes(status) ? COLORS.greenDark : COLORS.blue}
          />
        ))}
        <Button
          title="Drone ile Doğrulandı"
          onPress={() => setOnlyDroneValidated(prev => !prev)}
          color={onlyDroneValidated ? COLORS.greenDark : COLORS.blue}
        />
      </View>

      <Button title={text.sortByVictims} onPress={handleSortByVictims} />

      <View style={{ marginTop: 16 }}>
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            address={report.address === 'Adres bulunamadı' ? text.noAddress : report.address}
            victimCount={report.victimCount}
            status={report.status}
            tweet={report.tweet}
            coordinates={report.coordinates}
            phoneNumber={report.phoneNumber}
            needs={report.needs}
            isDroneValidated={report.isDroneValidated}
            language={language}
            userLoggedIn={userLoggedIn}
            onUpdateStatus={userLoggedIn ? (newStatus) => handleUpdateStatus(report.id, newStatus) : () => { }}
          />
        ))}
      </View>
    </ScrollView>
  );
}