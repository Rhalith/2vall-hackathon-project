import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DropdownProps {
  label: string;
  options: string[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  clearText?: string;
}

export default function Dropdown({
  label,
  options,
  selectedValue,
  onValueChange,
  clearText = 'Clear selection',
}: DropdownProps) {
  const [visible, setVisible] = useState(false);

  const fullOptions = [''].concat(options); // Add empty string to represent "clear selection"

  const handleSelect = (value: string) => {
    onValueChange(value);
    setVisible(false);
  };

  return (
    <View style={{ marginBottom: 16, width: '100%' }}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, !selectedValue && { color: '#aaa' }]}>
          {selectedValue || label}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#555" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={fullOptions}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>
                    {item === '' ? clearText : item}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '500',
    fontSize: Platform.OS === 'android' ? 13 : 15,
    marginBottom: 6,
    color: '#333',
  },
  button: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: Platform.OS === 'android' ? 14 : 16,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: 380,
    width: screenWidth,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
});