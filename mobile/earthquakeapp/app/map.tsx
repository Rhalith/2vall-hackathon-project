import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { getLanguageText } from "@/utils/language";
import { Report } from "@/types/Report";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BACKEND } from "@/utils/api";
import { COLORS } from "@/utils/colors";

interface LocationGroupType {
  lat: number;
  lon: number;
  count: number;
  reports: Report[];
}

const { height } = Dimensions.get("window");
const OVERLAY_MAX_HEIGHT = Math.min(300, height * 0.4);

export default function MapScreen() {
  const [groupedLocations, setGroupedLocations] = useState<LocationGroupType[]>(
    []
  );
  const [language, setLanguage] = useState<"TR" | "EN">("TR");
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMarker, setSelectedMarker] =
    useState<LocationGroupType | null>(null);

  const text = getLanguageText(language);
  const mapRef = useRef<MapView | null>(null);

  // Groups reports by coordinates
  const groupLocationsByCoordinates = (reports: Report[]) => {
    const map: Record<string, { count: number; reports: Report[] }> = {};
    reports.forEach((r) => {
      if (!r.coordinates) return;
      const lat = parseFloat(r.coordinates.latitude);
      const lon = parseFloat(r.coordinates.longitude);
      if (isNaN(lat) || isNaN(lon)) return;
      const key = `${lat},${lon}`;
      if (!map[key]) map[key] = { count: 0, reports: [] };
      map[key].count++;
      map[key].reports.push(r);
    });
    return Object.entries(map).map(([key, data]) => {
      const [lat, lon] = key.split(",");
      return {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        count: data.count,
        reports: data.reports,
      };
    });
  };

  // Load cached reports
  const loadFromCache = async () => {
    const cached = await AsyncStorage.getItem("reports");
    const timestamp = await AsyncStorage.getItem("cachedReportsTimestamp");
    if (cached) {
      try {
        const parsed: Report[] = JSON.parse(cached);
        const valid = parsed.filter(
          (r) => r.coordinates?.latitude && r.coordinates?.longitude
        );
        setGroupedLocations(groupLocationsByCoordinates(valid));
        if (timestamp) setLastUpdated(new Date(timestamp));
        return true;
      } catch {}
    }
    return false;
  };

  // Fetch new data
  const refreshFromAPI = async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get<any[]>(`${API_BACKEND}/api/reports`);
      const parsed: Report[] = response.data
        .filter(
          (r) =>
            r.c && typeof r.c.lat === "number" && typeof r.c.lng === "number"
        )
        .map(
          (r) =>
            ({
              id: r._id?.$oid || "",
              locationHierarchy: r.a || "",
              victimCount: r.v || 0,
              status: r.s || "",
              isDroneValidated: r.d || false,
              coordinates: {
                latitude: r.c.lat.toString(),
                longitude: r.c.lng.toString(),
              },
            } as Report)
        );
      setGroupedLocations(groupLocationsByCoordinates(parsed));
      const now = new Date();
      setLastUpdated(now);
      await AsyncStorage.setItem("reports", JSON.stringify(parsed));
      await AsyncStorage.setItem("cachedReportsTimestamp", now.toISOString());
    } catch (e) {
      console.error("Error fetching reports:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadFromCache();
      await refreshFromAPI();
    })();
  }, []);

  // Auto refresh every 10 minutes
  useEffect(() => {
    const id = setInterval(refreshFromAPI, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Fit map to markers
  useEffect(() => {
    if (groupedLocations.length && mapRef.current) {
      const coords = groupedLocations.map((loc) => ({
        latitude: loc.lat,
        longitude: loc.lon,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [groupedLocations]);

  // Copy handler
  const handleCopy = (text: string, id: string) => {
    Clipboard.setStringAsync(text);
    setCopiedReportId(id);
    setTimeout(() => setCopiedReportId(null), 2000);
  };

  // Language toggle
  const handleLanguageSwitch = async () => {
    const next = language === "TR" ? "EN" : "TR";
    setLanguage(next);
    await AsyncStorage.setItem("language", next);
  };

  const statusTranslation: Record<string, string> = {
    "Yardım Bekliyor": text.helpNeeded,
    Gidildi: text.visited,
    Asılsız: text.falseReport,
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLanguageSwitch} style={styles.button}>
          <Text style={styles.buttonText}>{text.languageSwitch}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{text.mainPage}</Text>
        </TouchableOpacity>
      </View>
      {/* Timestamps */}
      {lastUpdated && (
        <Text style={styles.timestamp}>
          {language === "TR" ? "Son güncelleme: " : "Last updated: "}
          {lastUpdated.toLocaleString(language === "TR" ? "tr-TR" : "en-US")}
        </Text>
      )}
      {isRefreshing && (
        <Text style={styles.timestamp}>{text.dataUpdating}</Text>
      )}
      {/* Map */}
      <MapView ref={mapRef} style={styles.map}>
        {groupedLocations.map((loc) => (
          <Marker
            key={`${loc.lat}-${loc.lon}`}
            coordinate={{ latitude: loc.lat, longitude: loc.lon }}
            onPress={() => setSelectedMarker(loc)}
            tracksViewChanges={
              selectedMarker?.lat === loc.lat && selectedMarker?.lon === loc.lon
            }
          />
        ))}
      </MapView>
      {selectedMarker && <View style={styles.backdrop} />}
      {selectedMarker && (
        <View style={[styles.overlayContainer]}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              onPress={() => setSelectedMarker(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
            {selectedMarker.reports.slice(0, 3).map((r, i) => (
              <View key={r.id || `${i}`} style={styles.reportBlock}>
                <Text style={styles.address}>
                  {r.locationHierarchy ||
                    (language === "TR" ? "Adres yok" : "No address")}
                </Text>

                <Text style={styles.victimInfo}>
                  {text.estimatedVictims}: {r.victimCount || "—"}
                </Text>

                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.droneStatus,
                      {
                        backgroundColor: r.isDroneValidated
                          ? "#bbf7d0"
                          : "#fef08a",
                        borderColor: r.isDroneValidated ? "#bbf7d0" : "#fef08a",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.droneStatusText,
                        { color: r.isDroneValidated ? "#065f46" : "#92400e" },
                      ]}
                    >
                      {r.isDroneValidated
                        ? text.droneValidated
                        : text.droneNotValidated}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          r.status === "Yardım Bekliyor"
                            ? "#fef08a"
                            : r.status === "Gidildi"
                            ? "#86efac"
                            : "#fecaca",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            r.status === "Yardım Bekliyor"
                              ? "#92400e"
                              : r.status === "Gidildi"
                              ? "#065f46"
                              : "#b91c1c",
                        },
                      ]}
                    >
                      {statusTranslation[
                        r.status as keyof typeof statusTranslation
                      ] || r.status}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleCopy(r.locationHierarchy, r.id)}
                  style={styles.copyLink}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    {copiedReportId === r.id ? text.copied : text.shareLocation}
                  </Text>
                </TouchableOpacity>
                {i < selectedMarker.reports.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  timestamp: { textAlign: "center", marginBottom: 5 },
  map: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  overlayContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 32, // <-- This avoids overlap with close button
    paddingBottom: 40,
  },

  closeButton: {
    position: "absolute",
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
  },

  address: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  copyLink: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    color: "white",
    fontWeight: "bold",
    marginVertical: 8,
  },

  info: {
    fontSize: 14,
    marginBottom: 4,
    color: "#111827",
  },

  reportBlock: { marginBottom: 16 },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },

  shareButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  shareButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  victimInfo: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#111827",
  },
  statusBadge: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 8, // spacing between badges
  },


  droneStatus: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  droneStatusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
