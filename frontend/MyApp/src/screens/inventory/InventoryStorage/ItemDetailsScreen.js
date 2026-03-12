// screens/ItemDetailsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ If adb reverse is set: adb reverse tcp:3000 tcp:3000
// const BASE_URL = 'http://localhost:3000';

// ✅ Or use your Wi-Fi IP
// const BASE_URL = 'http://192.168.0.111:3000';

export default function ItemDetailsScreen({ route }) {
  const { itemName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchItemDetail = useCallback(async () => {
    if (!itemName) {
      setLoading(false);
      setDetail(null);
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const url = `${BASE_URL}/api/debt?name_of_material=${encodeURIComponent(
        itemName
      )}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch item details');
      }

      setDetail(data);
    } catch (err) {
      console.error('fetchItemDetail error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [itemName]);

  useEffect(() => {
    fetchItemDetail();
  }, [fetchItemDetail]);

  const renderWorkerDebt = ({ item }) => (
    <View style={styles.workerCard}>
      {/* Left side: Name + ID */}
      <View style={styles.workerLeft}>
        <Text style={styles.workerName}>
          {item.worker_name ? item.worker_name : 'Unknown Worker'}
        </Text>
        <Text style={styles.workerId}>ID: {item.worker_id}</Text>
      </View>

      {/* Right side: Debt Count */}
      <View style={styles.debtBadge}>
        <Text style={styles.debtBadgeLabel}>Debt</Text>
        <Text style={styles.debtBadgeValue}>{item.debt_count ?? 0}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No details found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={Array.isArray(detail.data) ? detail.data : []}
        keyExtractor={(item, index) => `${item.worker_id}-${index}`}
        renderItem={renderWorkerDebt}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.topCard}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Item Details</Text>

                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={fetchItemDetail}
                  activeOpacity={0.8}
                >
                  <Text style={styles.refreshBtnText}>Refresh</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Material:</Text>
                <Text style={styles.value}>
                  {String(detail.material || itemName || '').toUpperCase()}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Inventory Total:</Text>
                <Text style={styles.value}>{detail.inventory_total ?? 0}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Workers in Debt:</Text>
                <Text style={styles.value}>
                  {detail.total_workers_in_debt ?? 0}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Workers Debt List</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No workers currently in debt for this item.
            </Text>
          </View>
        }
      />
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
  listContent: {
    paddingBottom: 24,
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
  topCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
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
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },
  workerCard: {
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
  workerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  workerId: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  debtBadge: {
    minWidth: 68,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debtBadgeLabel: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '700',
  },
  debtBadgeValue: {
    marginTop: 2,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '800',
  },
  emptyBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
});