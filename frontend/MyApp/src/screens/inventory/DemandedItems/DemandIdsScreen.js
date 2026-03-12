// DemandIdsScreen.js
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native'; // ✅ add this
import DemandItemDetailsScreen from './DemandItemDetailsScreen';
// ✅ localhost if adb reverse is set: adb reverse tcp:3000 tcp:3000
// const BASE_URL = "http://localhost:3000";

// ✅ Wi-Fi IP (same network)
// const BASE_URL = 'http://192.168.0.111:3000';

export default function DemandIdsScreen() {
  const navigation = useNavigation(); // ✅ add this

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDemandIds = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {setRefreshing(true);}
      else {setLoading(true);}

      setError('');

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/demand_ids`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to fetch demand ids');
      }

      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.log('fetchDemandIds error:', err);
      setError(err.message || 'Something went wrong');
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandIds();
  }, [fetchDemandIds]);

  const renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('DemandItemDetailsScreen', {
            complaint_id: item.complaint_id, // ✅ details page uses this
            worker_id: item.worker_id,       // optional (future use)
            name: item.name,                 // optional (future use)
          })
        }
      >
        <Text style={styles.title}>{item.name || 'Unknown Worker'}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Worker ID:</Text>
          <Text style={styles.value}>{item.worker_id}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Complaint ID:</Text>
          <Text style={styles.value}>{item.complaint_id}</Text>
        </View>

        <Text style={styles.tapHint}>Tap to view details →</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading demand items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Demand IDs</Text>
        <TouchableOpacity style={styles.reloadBtn} onPress={() => fetchDemandIds()}>
          <Text style={styles.reloadText}>Reload</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item, index) =>
          `${item.worker_id}-${item.complaint_id}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : { paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDemandIds(true)}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No demand items found.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  reloadBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reloadText: {
    color: '#fff',
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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: 110,
    fontWeight: '600',
    color: '#374151',
  },
  value: {
    flex: 1,
    color: '#111827',
  },
  tapHint: {
    marginTop: 8,
    color: '#2563eb',
    fontWeight: '600',
  },
  emptyWrap: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
