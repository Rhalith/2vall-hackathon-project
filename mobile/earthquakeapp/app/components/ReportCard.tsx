import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getLanguageText } from '../../utils/language';
import { getUserRoles, isUserLoggedIn } from '../../utils/auth'; 

type Language = 'TR' | 'EN';

interface Coordinates {
  latitude: string;
  longitude: string;
}

interface Props {
  address: string;
  victimCount: number;
  status: string;
  tweet?: string;
  coordinates: Coordinates;
  phoneNumber?: string;
  needs?: string;
  isDroneValidated: boolean;
  language: Language;
  userLoggedIn: boolean;
  onUpdateStatus: (newStatus: string) => void;
}

export default function ReportCard({
  address,
  victimCount,
  status,
  tweet,
  phoneNumber,
  needs,
  isDroneValidated,
  language,
  userLoggedIn,
  onUpdateStatus,
}: Props) {
  const [isTweetVisible, setIsTweetVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const text = getLanguageText(language);


  const displayPhoneNumber =
    phoneNumber && phoneNumber.toLowerCase() !== 'n/a' && phoneNumber.toLowerCase() !== 'yok'
      ? phoneNumber
      : text.noInfo;

  const displayNeeds =
    needs && needs.toLowerCase() !== 'n/a' && needs.toLowerCase() !== 'yok'
      ? needs
      : text.noInfo;

  const statusTranslation: Record<string, string> = {
    'Yardım Bekliyor': text.helpNeeded,
    'Gidildi': text.visited,
    'Asılsız': text.falseReport,
  };

  const reverseStatusTranslation: Record<string, string> = {
    [text.helpNeeded]: 'Yardım Bekliyor',
    [text.visited]: 'Gidildi',
    [text.falseReport]: 'Asılsız',
  };

  const translatedStatus = statusTranslation[status] || status;

  const statusMapping = {
    [text.changeToVisited]: text.visited,
    [text.changeToFalse]: text.falseReport,
    [text.changeToHelpNeeded]: text.helpNeeded,
  };

  const handleStatusChange = (newStatus: string) => {
    const turkishStatus = reverseStatusTranslation[newStatus] || newStatus;
    onUpdateStatus(turkishStatus);
    setIsDropdownVisible(false);
  };

  const handleCopy = () => {
    Clipboard.setStringAsync(address);
    setIsCopied(true);
    Alert.alert(text.shareLocation, text.copied);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.address}>{address}</Text>
      <Text>{text.estimatedVictims}: {victimCount}</Text>
      <Text style={[
        styles.status,
        {
          backgroundColor:
            status === 'Yardım Bekliyor' ? '#fef08a' :
            status === 'Gidildi' ? '#86efac' :
            '#fecaca',
          color:
            status === 'Yardım Bekliyor' ? '#92400e' :
            status === 'Gidildi' ? '#065f46' :
            '#b91c1c',
        }
      ]}>
        {translatedStatus}
      </Text>
      <View style={[
  styles.droneStatus,
  {
    backgroundColor: isDroneValidated ? '#bbf7d0' : '#fef2f2',
    borderColor: isDroneValidated ? '#10b981' : '#ef4444',
  }
]}>
  <Text style={[
    styles.droneStatusText,
    { color: isDroneValidated ? '#065f46' : '#991b1b' }
  ]}>
    {isDroneValidated ? text.droneValidated : text.droneNotValidated}
  </Text>
</View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>{text.importantInfo}</Text>
        <Text>{text.phoneNumber}: {displayPhoneNumber}</Text>
        <Text>{text.needs}: {displayNeeds}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.button} onPress={() => setIsTweetVisible(!isTweetVisible)}>
          <Text style={styles.buttonText}>
            {isTweetVisible ? text.hideTweet : text.showTweet}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleCopy}>
          <Text style={styles.buttonText}>
            {isCopied ? text.copied : text.shareLocation}
          </Text>
        </TouchableOpacity>
      </View>

      {isTweetVisible && (
        <View style={styles.tweetBox}>
          <Text>{tweet || text.noTweet}</Text>
        </View>
      )}

      {userLoggedIn && (
        <View>
          <TouchableOpacity onPress={() => setIsDropdownVisible(!isDropdownVisible)} style={styles.dropdownButton}>
            <Text>{text.changeStatus}</Text>
          </TouchableOpacity>
          {isDropdownVisible && (
            <View>
              {Object.entries(statusMapping).map(([label, value]) => (
                <TouchableOpacity key={label} onPress={() => handleStatusChange(value)}>
                  <Text style={styles.dropdownOption}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  address: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  status: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginVertical: 6,
  },
  droneStatus: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  
  droneStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tweetBox: {
    backgroundColor: '#e5e7eb',
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
  },
  dropdownButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#d1d5db',
    alignItems: 'center',
    borderRadius: 6,
  },
  dropdownOption: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    marginVertical: 2,
    borderRadius: 4,
    textAlign: 'center',
  },
});