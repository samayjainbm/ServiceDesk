// src/screens/DemandStockScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY } from '../../../../config';

export default function DemandStockScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [demandValues, setDemandValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const getToken = async () => {
    const possibleKeys = [TOKEN_KEY, 'token', 'admin_token', 'auth_token'].filter(Boolean);

    for (const key of possibleKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) return value;
    }
    return null;
  };

  const fetchItems = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await fetch(`${BASE_URL}/api/item_display`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to fetch items');
      }

      const fetchedItems = Array.isArray(data.data) ? data.data : [];
      setItems(fetchedItems);

      const initialValues = {};
      fetchedItems.forEach((item) => {
        initialValues[item.item_name] = '';
      });
      setDemandValues(initialValues);
    } catch (err) {
      console.log('fetchItems error:', err);
      Alert.alert('Error', err.message || 'Unable to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const updateDemandValue = (itemName, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setDemandValues((prev) => ({
      ...prev,
      [itemName]: cleaned,
    }));
  };

  const payloadItems = useMemo(() => {
    return items
      .map((item) => ({
        item_name: String(item.item_name || '').trim().toLowerCase(),
        count: Number(demandValues[item.item_name] || 0),
      }))
      .filter((item) => item.item_name && item.count > 0);
  }, [items, demandValues]);

  const handleSubmit = async () => {
    try {
      if (payloadItems.length === 0) {
        Alert.alert('Validation Error', 'At least one item count must be greater than 0');
        return;
      }

      setSubmitting(true);

      const token = await getToken();

      if (!token) {
        throw new Error('Not logged in');
      }

      const res = await fetch(`${BASE_URL}/api/demandstock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: payloadItems,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save demand stock');
      }

      Alert.alert(
        'Success',
        data.message || 'Demand stock saved successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              const cleared = {};
              items.forEach((item) => {
                cleared[item.item_name] = '';
              });
              setDemandValues(cleared);
              navigation.goBack();
            },
          },
        ]
      );
    } catch (err) {
      console.log('handleSubmit error:', err);
      Alert.alert('Error', err.message || 'Unable to save demand stock');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const availableCount = item.count ?? item.item_count ?? 0;

    return (
      <View style={styles.card}>
        <View style={styles.leftSection}>
          <Text style={styles.itemName}>Item {String(item.item_name).toUpperCase()}</Text>
          <Text style={styles.availableText}>Available: {availableCount}</Text>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.inputLabel}>Demand</Text>
          <TextInput
            style={styles.input}
            value={demandValues[item.item_name] ?? ''}
            onChangeText={(text) => updateDemandValue(item.item_name, text)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#9ca3af"
            maxLength={6}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loaderText}>Loading items...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>Demand Stock</Text>
          <Text style={styles.subHeading}>Enter required quantities for items</Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.item_name}-${index}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No items found.</Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchItems}
            activeOpacity={0.85}
            disabled={loading || submitting}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabledButton]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Demand'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#f5f7fb',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loaderText: {
    marginTop: 10,
    color: '#374151',
    fontSize: 15,
  },
  header: {
    marginBottom: 14,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  subHeading: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    paddingBottom: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  leftSection: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  availableText: {
    marginTop: 6,
    fontSize: 13,
    color: '#6b7280',
  },
  rightSection: {
    width: 95,
    alignItems: 'stretch',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    marginBottom: 6,
    textAlign: 'center',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 8,
  },
  footer: {
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  refreshButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
});