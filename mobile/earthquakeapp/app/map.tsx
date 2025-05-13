import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { getLanguageText } from '@/utils/language';
import { Report } from '@/types/Report';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BACKEND } from '@/utils/api';
import { COLORS } from '@/utils/colors';

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
  const mapRef = useRef<MapView | null>(null);

  const groupLocationsByCoordinates = (reports: Report[]) => {
    const locationMap: Record<string, { count: number; reports: Report[] }> = {};
    reports.forEach((r: Report) => {
      if (!r.coordinates) return;

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
      const valid = parsed.filter(
        r => r.coordinates &&
          r.coordinates.latitude &&
          r.coordinates.longitude &&
          r.coordinates.latitude !== 'N/A' &&
          r.coordinates.longitude !== 'N/A'
      );
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
      const response = await axios.get<any[]>(API_BACKEND + '/api/reports');
      const rawReports = response.data;
      const parsedReports: Report[] = rawReports
        .filter(r => r.c && typeof r.c.lat === 'number' && typeof r.c.lng === 'number')
        .map((r) => ({
          id: r._id?.$oid || '', // Adjust if needed
          address: r.a || '',
          tweet: r.t || '',
          victimCount: r.v || 0,
          status: r.s || '',
          isDroneValidated: r.d || false,
          coordinates: {
            latitude: r.c.lat.toString(),
            longitude: r.c.lng.toString(),
          },
          phoneNumber: r.ct?.p || '',
          needs: r.ct?.n || '',
          region: r.a?.split(' ')[0] || '',
          district: r.a?.split(' ')[1] || '',
          neighborhood: r.a?.split(' ')[2] || '',
          locationHierarchy: r.a || '',
        }));

      const grouped = groupLocationsByCoordinates(parsedReports);
      setGroupedLocations(grouped);
      setLastUpdated(new Date());
      await AsyncStorage.setItem('reports', JSON.stringify(parsedReports));
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

  const handleLanguageSwitch = async () => {
    const newLanguage = language === 'TR' ? 'EN' : 'TR';
    setLanguage(newLanguage);
    await AsyncStorage.setItem('language', newLanguage);
  };

  useEffect(() => {
    if (groupedLocations.length > 0 && mapRef.current) {
      const coords = groupedLocations.map(loc => ({
        latitude: loc.lat,
        longitude: loc.lon,
      }));

      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [groupedLocations]);

  const statusTranslation: Record<'Yardım Bekliyor' | 'Gidildi' | 'Asılsız', string> = {
    'Yardım Bekliyor': text.helpNeeded,
    'Gidildi': text.visited,
    'Asılsız': text.falseReport,
  };

  const StyledButton = ({ title, onPress, active }: { title: string; onPress: () => void; active?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: active ? COLORS.blueDark : COLORS.blue,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 6,
      }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between', marginLeft: 10, marginTop: 10 }}>
        <StyledButton title={text.languageSwitch || 'Dil Değiştir'} onPress={handleLanguageSwitch} />
        <StyledButton title={text.mainPage} onPress={() => router.push('/')} />
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
        ref={mapRef}
        style={{ flex: 1 }}
      >
        {groupedLocations.map(loc => (
          <Marker
            key={`${loc.lat}-${loc.lon}`}
            coordinate={{ latitude: loc.lat, longitude: loc.lon }}
            pinColor={'#0053a0'}
          >
            <Callout tooltip={false}>
              <View style={{
                backgroundColor: 'white',
                padding: 10,
                borderRadius: 8,
                width: 250,
                maxHeight: 200,
                justifyContent: 'center',
              }}>
                {loc.reports.length === 0 ? (
                  <Text>{language === 'TR' ? 'Bilgi yok' : 'No data'}</Text>
                ) : (
                  loc.reports.slice(0, 3).map((r, i) => (
                    <View key={r.id || `${r.address}-${i}`} style={{ marginBottom: 10 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
                        {r.locationHierarchy || (language === 'TR' ? 'Adres yok' : 'No address')}
                      </Text>

                      <TouchableOpacity onPress={() => handleCopy(r.locationHierarchy, r.id)}>
                        <Text style={{ color: '#1f77b4', marginBottom: 4 }}>
                          {copiedReportId === r.id ? text.copied : text.shareLocation}
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12 }}>{text.estimatedVictims}: {r.victimCount || '—'}</Text>
                      <Text style={{ fontSize: 12 }}>{text.status}: {statusTranslation[r.status as 'Yardım Bekliyor' | 'Gidildi' | 'Asılsız'] || r.status}</Text>

                      {i < loc.reports.length - 1 && (
                        <View style={{ height: 1, backgroundColor: '#ccc', marginTop: 6 }} />
                      )}
                    </View>
                  ))
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}
