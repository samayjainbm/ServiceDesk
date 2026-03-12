// screens/AddInventoryStorageScreen.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddInventoryStorageScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const initializeRows = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // ✅ fetch item names + current counts together
      const [namesRes, countsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/get_item_names`, {
          method: 'GET',
          headers,
        }),
        fetch(`${BASE_URL}/api/item_display`, {
          method: 'GET',
          headers,
        }),
      ]);

      const namesData = await namesRes.json();
      const countsData = await countsRes.json();

      // names API fail ho gaya toh aage kaam mushkil hai
      if (!namesRes.ok || !namesData.success || !Array.isArray(namesData.data)) {
        throw new Error(namesData.message || namesData.error || 'Failed to fetch item names');
      }

      // item names normalize
      const itemNames = namesData.data
        .map((it) =>
          typeof it === 'string'
            ? String(it).toLowerCase()
            : String(it.item_name || '').toLowerCase()
        )
        .filter(Boolean);

      // counts API fail ho toh bhi names dikha denge with 0 current count
      const countMap = new Map();
      if (countsRes.ok && countsData.success && Array.isArray(countsData.data)) {
        countsData.data.forEach((it) => {
          const name = String(it.item_name || '').toLowerCase();
          const count = Number(it.count ?? it.item_count ?? 0);
          if (name) {
            countMap.set(name, count);
          }
        });
      }

      const formatted = itemNames.map((name) => ({
        item_name: name,
        current_count: countMap.get(name) ?? 0,
        added_item_count: '',
      }));

      setRows(formatted);
    } catch (err) {
      console.error('initializeRows error:', err);
      setRows([]);
      Alert.alert('Error', err.message || 'Could not fetch inventory items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeRows();
  }, [initializeRows]);

  const updateCount = (itemName, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');

    setRows((prev) =>
      prev.map((row) =>
        row.item_name === itemName
          ? { ...row, added_item_count: cleaned }
          : row
      )
    );
  };

  const payload = useMemo(() => {
    return rows.map((row) => ({
      item_name: row.item_name,
      added_item_count:
        row.added_item_count === '' ? 0 : Number(row.added_item_count),
    }));
  }, [rows]);

  const totalAdded = useMemo(() => {
    return payload.reduce((sum, row) => sum + (Number(row.added_item_count) || 0), 0);
  }, [payload]);

  const handleSubmit = async () => {
    try {
      if (!Array.isArray(rows) || rows.length === 0) {
        return Alert.alert('Validation', 'No items available to submit.');
      }

      for (const row of payload) {
        if (!String(row.item_name).trim()) {
          return Alert.alert('Validation', 'Invalid item name found.');
        }
        if (
          !Number.isInteger(row.added_item_count) ||
          row.added_item_count < 0
        ) {
          return Alert.alert(
            'Validation',
            `Invalid added_item_count for item ${row.item_name}`
          );
        }
      }

      setSubmitting(true);

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/add_items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to add items');
      }

      Alert.alert('Success', data.message || 'Items added successfully.', [
        {
          text: 'OK',
          onPress: () => {
            setRows((prev) =>
              prev.map((r) => ({ ...r, added_item_count: '' }))
            );
            initializeRows();
          },
        },
      ]);
    } catch (err) {
      console.error('handleSubmit error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillZero = () => {
    setRows((prev) => prev.map((r) => ({ ...r, added_item_count: '0' })));
  };

  const handleClearAll = () => {
    setRows((prev) => prev.map((r) => ({ ...r, added_item_count: '' })));
  };

  const renderRow = ({ item }) => {
    return (
      <View style={styles.itemRow}>
        <View style={styles.leftSection}>
          <Text style={styles.itemName}>{item.item_name.toUpperCase()}</Text>
          <Text style={styles.currentCount}>
            Current: {item.current_count ?? 0}
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Add</Text>
          <TextInput
            style={styles.input}
            value={item.added_item_count ?? ''}
            onChangeText={(text) => updateCount(item.item_name, text)}
            placeholder="0"
            keyboardType="numeric"
            maxLength={6}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading inventory items...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={rows}
          keyExtractor={(item, index) => `${item.item_name}-${index}`}
          renderItem={renderRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.topCard}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>Add Inventory Storage</Text>

                  <TouchableOpacity
                    style={styles.refreshBtn}
                    onPress={initializeRows}
                    activeOpacity={0.85}
                    disabled={submitting}
                  >
                    <Text style={styles.refreshBtnText}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                  Enter quantity to add for each item.
                </Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total to add:</Text>
                  <Text style={styles.summaryValue}>{totalAdded}</Text>
                </View>
              </View>

              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleFillZero}
                  activeOpacity={0.85}
                  disabled={submitting}
                >
                  <Text style={styles.secondaryBtnText}>Fill 0 for All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleClearAll}
                  activeOpacity={0.85}
                  disabled={submitting}
                >
                  <Text style={styles.secondaryBtnText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No item names found.</Text>
            </View>
          }
          ListFooterComponent={
            rows.length > 0 ? (
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Added Items</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#374151',
  },
  listContent: {
    paddingBottom: 24,
  },
  topCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    paddingRight: 10,
  },
  refreshBtn: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  summaryRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryLabel: {
    color: '#374151',
    fontWeight: '600',
  },
  summaryValue: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryBtnText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  itemRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  leftSection: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  currentCount: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  inputWrap: {
    width: 92,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  submitBtn: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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