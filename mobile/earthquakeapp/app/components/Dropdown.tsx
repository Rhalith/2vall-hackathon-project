import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

export interface OptionItem {
  value: string;
  label: string;
}

interface DropdownProps {
  data: OptionItem[];
  placeholder: string;
  onChange: (item: OptionItem) => void;
  clearText?: string;
  selectedValue?: string;
}

export default function Dropdown({
  data,
  placeholder,
  onChange,
  clearText = 'Clear selection',
  selectedValue,
}: DropdownProps) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState<OptionItem | null>(null);

  useEffect(() => {
    if (selectedValue === undefined) return;

    if (selectedValue === '') {
      setValue(null);
    } else if (selectedValue !== value?.value) {
      const match = data.find((o) => o.value === selectedValue) || null;
      setValue(match);
    }
  }, [selectedValue, data, value]);
  const buttonRef = useRef<View>(null);

  const [sheetPos, setSheetPos] = useState({
    top: 0,
    left: 0,
    width: 200,
    maxHeight: 250,
    openUpwards: false,
  });

  const fullData = clearText
    ? [{ value: '', label: clearText }, ...data]
    : data;

  const openSheet = useCallback(() => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      const spaceBelow = screenHeight - (y + height);
      const neededHeight = Math.min(40 * fullData.length + 20, 250);
      const openUpwards = spaceBelow < neededHeight + 16;

      const top = openUpwards ? y - neededHeight - 4 : y + height + 4;

      setSheetPos({
        top,
        left: x,
        width,
        maxHeight: neededHeight,
        openUpwards,
      });
      setExpanded(true);
    });
  }, [fullData.length]);

  const onSelect = useCallback(
    (item: OptionItem) => {
      setValue(item.value ? item : null);
      onChange(item);
      setExpanded(false);
    },
    [onChange],
  );
  return (
    <View ref={buttonRef}>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={openSheet}
      >
        <Text style={[styles.buttonText, !value && { color: '#aaa' }]}>
          {value?.label || placeholder}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#555"
        />
      </TouchableOpacity>
      {expanded && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
            <View style={styles.backdrop}>
              <View
                style={[
                  styles.sheet,
                  {
                    top: sheetPos.top,
                    left: sheetPos.left,
                    width: sheetPos.width,
                    maxHeight: sheetPos.maxHeight,
                    borderBottomRightRadius: sheetPos.openUpwards ? 8 : 0,
                    borderBottomLeftRadius: sheetPos.openUpwards ? 8 : 0,
                    borderTopLeftRadius: sheetPos.openUpwards ? 0 : 8,
                    borderTopRightRadius: sheetPos.openUpwards ? 0 : 8,
                  },
                ]}
              >
                <FlatList
                  data={fullData}
                  keyExtractor={(item) => item.value + item.label}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.option}
                      activeOpacity={0.8}
                      onPress={() => onSelect(item)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          item.value === value?.value && { fontWeight: '600' },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                  )}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheet: {
    position: 'absolute',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});