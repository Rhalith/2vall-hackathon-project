import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, TextInput, Alert, TouchableOpacity, StyleSheet, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { router, useFocusEffect } from 'expo-router';
import { getLanguageText } from '../../utils/language';
import { isUserLoggedIn, logout } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReportCard from '../components/ReportCard';
import { Report } from '../../types/Report';
import axios from 'axios';
import { COLORS } from '@/utils/colors';
import Dropdown from '../components/Dropdown';
import { API_BACKEND } from '@/utils/api';

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
      const response = await axios.get<any[]>(API_BACKEND+'/api/reports'); // Replace with your backend URL
      const rawReports = response.data;

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

  const StyledButton = ({ title, onPress, active }: { title: string; onPress: () => void; active?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: active ? COLORS.greenDark : COLORS.blue,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 6,
        margin: 4,
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
    </TouchableOpacity>
  );

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await axios.patch(API_BACKEND+`/api/reports/updateStatus/${id}`, {
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
  <StyledButton title={text.languageSwitch || 'Dil Değiştir'} onPress={handleLanguageSwitch} />
  <StyledButton title="MAP" onPress={() => router.push('/map')} />
  {userLoggedIn ? (
    <StyledButton title={text.logout} onPress={() => { logout(); setUserLoggedIn(false); }} />
  ) : (
    <StyledButton title={text.login} onPress={() => router.push('/login')} />
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
  placeholderTextColor="#999"
  value={searchQuery}
  onChangeText={setSearchQuery}
  style={{
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    color: '#000',
  }}
/>
<View style={{ marginTop: 10, marginBottom: 8, minHeight: 100, overflow: 'hidden' }}>
<Dropdown
  label={text.chooseRegionPlaceholder}
  options={[...new Set(reports.map(r => r.region))]}
  selectedValue={region}
  onValueChange={(newRegion) => {
    setRegion(newRegion);
    setDistrict('');
    setNeighborhood('');
  }}
  clearText={text.clearSelection}
/>

<Dropdown
  label={text.chooseDistrictPlaceholder}
  options={[...new Set(reports.filter(r => r.region === region).map(r => r.district))]}
  selectedValue={district}
  onValueChange={(newDistrict) => {
    setDistrict(newDistrict);
    setNeighborhood('');
  }}
  clearText={text.clearSelection}
/>

<Dropdown
  label={text.chooseNeighborhoodPlaceholder}
  options={[...new Set(reports.filter(r => r.district === district).map(r => r.neighborhood))]}
  selectedValue={neighborhood}
  onValueChange={setNeighborhood}
  clearText={text.clearSelection}
/>
</View>

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 6,
        backgroundColor: '#f3f4f6',
        marginBottom: 8
      }}>
{[text.helpNeeded, text.visited, text.falseReport].map(status => (
  <StyledButton
    key={status}
    title={status}
    onPress={() =>
      setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])
    }
    active={statusFilters.includes(status)}
  />
))}
<StyledButton
  title="Drone ile Doğrulandı"
  onPress={() => setOnlyDroneValidated(prev => !prev)}
  active={onlyDroneValidated}
/>
      </View>

      <StyledButton title={text.sortByVictims} onPress={handleSortByVictims} />

      <View style={{ marginTop: 16 }}>
        {filteredReports.map((report, index) => (
          <ReportCard
            key={report.id || `${report.address}-${index}`}
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