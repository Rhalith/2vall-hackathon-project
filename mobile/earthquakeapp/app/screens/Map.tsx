import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { getLanguageText } from '@/utils/language';
import { Report } from '@/types/Report';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface LocationGroupType {
  lat: number;
  lon: number;
  count: number;
  reports: Report[];
}

export default function MapScreen() {
  const [groupedLocations, setGroupedLocations] = useState<LocationGroupType[]>([]);
  const [language, setLanguage] = useState<'TR' | 'EN'>('TR');
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const text = getLanguageText(language);

  const groupLocationsByCoordinates = (reports: Report[]) => {
    const locationMap: Record<string, { count: number; reports: Report[] }> = {};
    reports.forEach((r: Report) => {
      const lat = parseFloat(r.coordinates.latitude);
      const lon = parseFloat(r.coordinates.longitude);
      if (!isNaN(lat) && !isNaN(lon)) {
        const key = `${lat},${lon}`;
        if (!locationMap[key]) {
          locationMap[key] = { count: 0, reports: [] };
        }
        locationMap[key].count++;
        locationMap[key].reports.push(r);
      }
    });

    return Object.entries(locationMap).map(([coordinates, data]) => {
      const [lat, lon] = coordinates.split(',');
      return {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        count: data.count,
        reports: data.reports,
      };
    });
  };

  const loadFromCache = async () => {
    const cached = await AsyncStorage.getItem('reports');
    const cachedTimestamp = await AsyncStorage.getItem('cachedReportsTimestamp');
    if (!cached) return false;
    try {
      const parsed: Report[] = JSON.parse(cached);
      const valid = parsed.filter(r => r.coordinates.latitude !== 'N/A' && r.coordinates.longitude !== 'N/A');
      const grouped = groupLocationsByCoordinates(valid);
      setGroupedLocations(grouped);
      if (cachedTimestamp) {
        setLastUpdated(new Date(cachedTimestamp));
      }
      return true;
    } catch (e) {
      console.warn('Invalid cachedReports format:', e);
      return false;
    }
  };

  const refreshFromAPI = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get<Report[]>('http://192.168.1.144:8080/api/reports');
      const parsed = response.data;
      const valid = parsed.filter(r => r.coordinates.latitude !== 'N/A' && r.coordinates.longitude !== 'N/A');
      const grouped = groupLocationsByCoordinates(valid);
      setGroupedLocations(grouped);
      setLastUpdated(new Date());
      await AsyncStorage.setItem('reports', JSON.stringify(parsed));
      await AsyncStorage.setItem('cachedReportsTimestamp', new Date().toISOString());
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadFromCache();
      await refreshFromAPI();
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshFromAPI();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    Clipboard.setStringAsync(text);
    setCopiedReportId(id);
    setTimeout(() => setCopiedReportId(null), 2000);
  };

  const statusTranslation: Record<'Yardım Bekliyor' | 'Gidildi' | 'Asılsız', string> = {
    'Yardım Bekliyor': text.helpNeeded,
    'Gidildi': text.visited,
    'Asılsız': text.falseReport,
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => setLanguage(prev => prev === 'TR' ? 'EN' : 'TR')}>
          <Text style={{ color: '#0053a0', fontWeight: 'bold' }}>{language === 'TR' ? 'EN' : 'TR'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/') }>
          <Text style={{ color: '#1f9d55', fontWeight: 'bold' }}>{language === 'TR' ? 'Ana Sayfa' : 'Home'}</Text>
        </TouchableOpacity>
      </View>

      {lastUpdated && (
        <Text style={{ textAlign: 'center', marginBottom: 5 }}>
          {language === 'TR' ? 'Son güncelleme: ' : 'Last updated: '}
          {lastUpdated.toLocaleString(language === 'TR' ? 'tr-TR' : 'en-US')}
        </Text>
      )}

      {isRefreshing && (
        <Text style={{ textAlign: 'center', marginBottom: 5 }}>
          {text.dataUpdating}
        </Text>
      )}

      <MapView
        style={{ height: 600 }}
        initialRegion={{
          latitude: 39.9334,
          longitude: 32.8597,
          latitudeDelta: 5,
          longitudeDelta: 5,
        }}
      >
        {groupedLocations.map(loc => (
          <Marker
            key={`${loc.lat}-${loc.lon}`}
            coordinate={{ latitude: loc.lat, longitude: loc.lon }}
            pinColor={'#0053a0'}
          >
            <Callout>
              <View style={{ width: 200 }}>
                {loc.reports.map((r, i) => (
                  <View key={i}>
                    <Text>{r.locationHierarchy}</Text>
                    <TouchableOpacity onPress={() => handleCopy(r.locationHierarchy, r.id)}>
                      <Text style={{ color: '#1f77b4' }}>{copiedReportId === r.id ? 'Kopyalandı' : 'Kopyala'}</Text>
                    </TouchableOpacity>
                    <Text>{text.estimatedVictims}: {r.victimCount}</Text>
                    <Text>{text.status}: {statusTranslation[r.status as 'Yardım Bekliyor' | 'Gidildi' | 'Asılsız'] || r.status}</Text>
                    <View style={{ height: 8 }} />
                  </View>
                ))}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </ScrollView>
  );
}
