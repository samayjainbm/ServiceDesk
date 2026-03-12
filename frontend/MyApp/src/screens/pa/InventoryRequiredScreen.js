// src/screens/InventoryRequiredScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY } from '../../../config';

export default function InventoryRequiredScreen({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getToken = async () => {
    const possibleKeys = [
      TOKEN_KEY,
      'token',
      'pa_token',
      'auth_token',
    ].filter(Boolean);

    for (const key of possibleKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        console.log('Token found in key:', key);
        return value;
      }
    }

    return null;
  };

  const fetchDemandStock = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = await getToken();

      if (!token) {
        Alert.alert('Error', 'Not logged in. Please login again.');
        setRows([]);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/get_demandstock`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to fetch demand stock');
      }

      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('fetchDemandStock error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandStock();
  }, [fetchDemandStock]);

  const groupedData = useMemo(() => {
    const groupedMap = new Map();

    rows.forEach((item) => {
      const rawDate = item.date ? new Date(item.date) : null;
      const dateKey =
        rawDate && !Number.isNaN(rawDate.getTime())
          ? rawDate.toISOString().slice(0, 10)
          : 'Unknown Date';

      if (!groupedMap.has(dateKey)) {
        groupedMap.set(dateKey, []);
      }

      groupedMap.get(dateKey).push(item);
    });

    return Array.from(groupedMap.entries()).map(([date, items]) => ({
      date,
      items,
    }));
  }, [rows]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Unknown Date') return dateString;

    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;

    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderDemandItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemName}>
          Item {String(item.item_name).toUpperCase()}
        </Text>
        <Text style={styles.itemMeta}>Item ID: {item.item_id}</Text>
      </View>

      <View style={styles.countBadge}>
        <Text style={styles.countLabel}>Required</Text>
        <Text style={styles.countValue}>{item.count}</Text>
      </View>
    </View>
  );

  const renderDateGroup = ({ item }) => (
    <View style={styles.groupContainer}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{formatDate(item.date)}</Text>
        <Text style={styles.groupSubtitle}>{item.items.length} item(s)</Text>
      </View>

      <FlatList
        data={item.items}
        keyExtractor={(subItem, index) =>
          `${subItem.date}-${subItem.item_id}-${subItem.item_name}-${subItem.count}-${index}`
        }
        renderItem={renderDemandItem}
        scrollEnabled={false}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading required inventory...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.topCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Inventory Required</Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => fetchDemandStock(true)}
            activeOpacity={0.85}
            disabled={refreshing}
          >
            <Text style={styles.refreshBtnText}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          This screen shows all required inventory entries from demand stock.
        </Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total entries</Text>
          <Text style={styles.summaryValue}>{rows.length}</Text>
        </View>
      </View>

      <FlatList
        data={groupedData}
        keyExtractor={(item) => item.date}
        renderItem={renderDateGroup}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => fetchDemandStock(true)}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No demand stock found.</Text>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#374151',
    fontSize: 15,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  backBtnText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
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
  listContent: {
    paddingBottom: 24,
  },
  groupContainer: {
    marginBottom: 14,
  },
  groupHeader: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  groupSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  itemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  countBadge: {
    minWidth: 86,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  countLabel: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '700',
  },
  countValue: {
    marginTop: 3,
    fontSize: 18,
    color: '#111827',
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