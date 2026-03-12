// screens/ItemDisplayScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import AddItems from './AddItems';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Use localhost if adb reverse is set
// const BASE_URL = 'http://localhost:3000';

// ✅ Or your Wi-Fi IP
// const BASE_URL = 'http://192.168.0.111:3000';

export default function ItemDisplayScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/item_display`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch items');
      }

      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('fetchItems error:', err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const renderItemCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('ItemDetailsScreen', {
            itemName: item.item_name,
          })
        }
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>
            Item: {String(item.item_name).toUpperCase()}
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeLabel}>Count</Text>
            <Text style={styles.countBadgeValue}>{item.count ?? 0}</Text>
          </View>
        </View>

        <Text style={styles.cardSubtitle}>Tap to view details</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading items...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Inventory Items</Text>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchItems}
          activeOpacity={0.85}
        >
          <Text style={styles.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.item_name}-${index}`}
        renderItem={renderItemCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={styles.returnItemsButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ReturnItemsScreen')}
            >
              <Text style={styles.returnItemsButtonText}>Return Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demandStockButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('DemandStockScreen')}
            >
              <Text style={styles.demandStockButtonText}>Demand Stock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.returnItemsButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AddItems')}
            >
              <Text style={styles.returnItemsButtonText}>Add New Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('AddInventoryStorageScreen')}
            >
              <Text style={styles.addButtonText}>Add Inventory Storage</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No items found.</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
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
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    paddingRight: 10,
  },
  cardSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
  },
  countBadge: {
    minWidth: 64,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  countBadgeLabel: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '700',
  },
  countBadgeValue: {
    marginTop: 2,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '800',
  },
  footerButtons: {
    marginTop: 14,
    gap: 10,
  },
  returnItemsButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  returnItemsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  demandStockButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  demandStockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
});