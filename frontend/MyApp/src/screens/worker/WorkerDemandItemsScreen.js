import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WorkerDemandItemsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaint_id ?? route?.params?.complaintId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // inventory items list from API: [{ item_name:"wire" }, ...]
  const [items, setItems] = useState([]);

  // quantities map: { "wire": "0", "q": "0", ... }
  const [quantities, setQuantities] = useState({});

  const buildInitialQuantities = (itemsArray) => {
    const obj = {};
    for (const it of itemsArray) {
      const key = String(it?.item_name ?? '').trim().toLowerCase();
      if (key) obj[key] = '0';
    }
    return obj;
  };

  const fetchItems = useCallback(async (isRefresh = false) => {
    try {
      if (!complaintId) throw new Error('complaint_id not provided');

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      const token = await AsyncStorage.getItem(TOKEN_KEY);

      const res = await fetch(`${BASE_URL}/api/worker/show_items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch items');
      }

      const list = Array.isArray(json.data) ? json.data : [];

      // ✅ show ALL items from inventory (no a..p filtering)
      setItems(list);

      // preserve typed values on refresh
      setQuantities((prev) => {
        const base = buildInitialQuantities(list);
        for (const key of Object.keys(base)) {
          if (prev[key] !== undefined) base[key] = prev[key];
        }
        return base;
      });
    } catch (err) {
      console.log('worker/show_items error:', err);
      const msg = err?.message || 'Something went wrong';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onChangeQty = (itemName, text) => {
    const cleaned = String(text).replace(/[^0-9]/g, '');
    const key = String(itemName).trim().toLowerCase();

    setQuantities((prev) => ({
      ...prev,
      [key]: cleaned === '' ? '' : cleaned,
    }));
  };

  // ✅ NEW: send only demanded items (count > 0)
  const demandedMaterials = useMemo(() => {
    const out = [];

    for (const it of items) {
      const name = String(it?.item_name ?? '').trim().toLowerCase();
      if (!name) continue;

      const raw = quantities[name];
      const num = raw === '' || raw === undefined ? 0 : Number(raw);

      if (!Number.isFinite(num)) continue;

      const intQty = Math.trunc(num);
      if (intQty > 0) {
        out.push({ item_name: name, count: intQty });
      }
    }

    return out;
  }, [items, quantities]);

  const totalDemand = useMemo(() => {
    let sum = 0;
    for (const row of demandedMaterials) sum += row.count;
    return sum;
  }, [demandedMaterials]);

  const handleSubmitDemand = useCallback(async () => {
    if (!complaintId) {
      Alert.alert('Error', 'Complaint ID not found');
      return;
    }

    if (demandedMaterials.length === 0) {
      Alert.alert('Validation', 'At least one item quantity should be greater than 0');
      return;
    }

    Alert.alert(
      'Submit Demand',
      `Send material request for complaint #${complaintId}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setSubmitLoading(true);

              const token = await AsyncStorage.getItem(TOKEN_KEY);

              const res = await fetch(`${BASE_URL}/api/material_req/${complaintId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  // ✅ ONLY demanded ones
                  materials: demandedMaterials,
                }),
              });

              const json = await res.json().catch(() => ({}));

              if (!res.ok || json.success === false) {
                throw new Error(json.message || 'Failed to submit material request');
              }

              Alert.alert('Success', 'Material demand request submitted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              console.log('material_req submit error:', err);
              Alert.alert('Error', err?.message || 'Failed to submit demand');
            } finally {
              setSubmitLoading(false);
            }
          },
        },
      ]
    );
  }, [complaintId, demandedMaterials, navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchItems(true)} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Demand Items</Text>

        <View style={styles.metaCard}>
          <Text style={styles.metaText}>Complaint ID: {complaintId ?? '-'}</Text>
          <Text style={styles.metaText}>Total Quantity: {totalDemand}</Text>
          <Text style={styles.metaSub}>
            Sending: {demandedMaterials.length} item(s)
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {items.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No items found.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items & Quantity</Text>

            {items.map((it, index) => {
              const itemName = String(it?.item_name ?? '').trim().toLowerCase();

              return (
                <View key={`${itemName}-${index}`} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.itemSub}>Enter required quantity</Text>
                  </View>

                  <TextInput
                    style={styles.qtyInput}
                    value={quantities[itemName] ?? '0'}
                    onChangeText={(text) => onChangeQty(itemName, text)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    maxLength={6}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitLoading || items.length === 0) && styles.disabledBtn]}
          onPress={handleSubmitDemand}
          disabled={submitLoading || items.length === 0}
          activeOpacity={0.85}
        >
          {submitLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Demand</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    padding: 14,
    paddingTop: 18,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metaCard: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  metaText: {
    color: '#1f2937',
    fontWeight: '600',
    marginBottom: 2,
  },
  metaSub: {
    marginTop: 4,
    color: '#4b5563',
    fontWeight: '600',
  },
  error: {
    color: '#dc2626',
    marginBottom: 10,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#edf0f3',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'capitalize',
  },
  itemSub: {
    marginTop: 2,
    color: '#6b7280',
    fontSize: 12,
  },
  qtyInput: {
    width: 78,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: 'center',
    backgroundColor: '#fff',
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#f6f7fb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});