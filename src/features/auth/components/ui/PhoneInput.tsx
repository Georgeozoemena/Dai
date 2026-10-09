import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parsePhoneNumber, getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { colors, radii } from '../../../../theme';

interface Country {
  code: string;
  name: string;
  callingCode: string;
}

// Popular countries first
const POPULAR_COUNTRIES = ['US', 'NG', 'GB', 'CA', 'IN'];

interface PhoneInputProps {
  value: string;
  onChangeText: (phone: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * International phone number input with country picker
 * Formats phone numbers and validates using libphonenumber-js
 */
export function PhoneInput({
  value,
  onChangeText,
  error,
  disabled = false,
  placeholder = 'Phone number'
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'US',
    name: 'United States',
    callingCode: '1'
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get all countries
  const allCountries: Country[] = React.useMemo(() => {
    const countries = getCountries().map(code => ({
      code,
      name: getCountryName(code),
      callingCode: getCountryCallingCode(code)
    }));

    // Sort: popular first, then alphabetically
    return countries.sort((a, b) => {
      const aPopular = POPULAR_COUNTRIES.indexOf(a.code);
      const bPopular = POPULAR_COUNTRIES.indexOf(b.code);

      if (aPopular !== -1 && bPopular !== -1) {
        return aPopular - bPopular;
      }
      if (aPopular !== -1) return -1;
      if (bPopular !== -1) return 1;

      return a.name.localeCompare(b.name);
    });
  }, []);

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!searchQuery) return allCountries;

    const query = searchQuery.toLowerCase();
    return allCountries.filter(
      country =>
        country.name.toLowerCase().includes(query) ||
        country.callingCode.includes(query) ||
        country.code.toLowerCase().includes(query)
    );
  }, [allCountries, searchQuery]);

  // Format phone number as user types
  const handleChangeText = (text: string) => {
    // Remove non-digits
    const digits = text.replace(/\D/g, '');
    
    // Build E.164 format
    const fullNumber = `+${selectedCountry.callingCode}${digits}`;
    
    try {
      // Try to parse and format
      const phoneNumber = parsePhoneNumber(fullNumber);
      if (phoneNumber) {
        onChangeText(phoneNumber.number); // E.164 format
        return;
      }
    } catch {
      // Invalid format, just store raw
    }

    onChangeText(fullNumber);
  };

  // Get display value (formatted)
  const displayValue = React.useMemo(() => {
    try {
      if (value) {
        const phoneNumber = parsePhoneNumber(value);
        if (phoneNumber) {
          // Remove country code for display
          return phoneNumber.nationalNumber;
        }
      }
    } catch {
      // Fall back to raw value
    }
    return value.replace(`+${selectedCountry.callingCode}`, '');
  }, [value, selectedCountry]);

  const selectCountry = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {/* Country Picker Button */}
        <Pressable
          onPress={() => !disabled && setShowCountryPicker(true)}
          disabled={disabled}
          style={styles.countryButton}
        >
          <Text style={styles.flag}>{getCountryFlag(selectedCountry.code)}</Text>
          <Text style={styles.callingCode}>+{selectedCountry.callingCode}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </Pressable>

        {/* Phone Number Input */}
        <TextInput
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          editable={!disabled}
          style={styles.input}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search country..."
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
              />
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectCountry(item)}
                  style={styles.countryItem}
                >
                  <Text style={styles.countryFlag}>{getCountryFlag(item.code)}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCode}>+{item.callingCode}</Text>
                </TouchableOpacity>
              )}
              style={styles.countryList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper functions
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getCountryName(code: string): string {
  const names: Record<string, string> = {
    US: 'United States',
    NG: 'Nigeria',
    GB: 'United Kingdom',
    CA: 'Canada',
    IN: 'India',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    ES: 'Spain',
    IT: 'Italy',
    BR: 'Brazil',
    MX: 'Mexico',
    JP: 'Japan',
    CN: 'China',
    KR: 'South Korea',
    // Add more as needed
  };
  return names[code] || code;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderInput,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    marginRight: 12,
    gap: 6,
  },
  flag: {
    fontSize: 24,
    lineHeight: 24,
    includeFontPadding: false,
  },
  callingCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: colors.text,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 6,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: colors.text,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  countryFlag: {
    fontSize: 24,
    lineHeight: 24,
    includeFontPadding: false,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  countryCode: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
