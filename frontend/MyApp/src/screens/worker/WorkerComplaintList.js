// screens/worker/WorkerComplaintsListScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
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

// ✅ same setup as your app
// const BASE_URL = 'http://192.168.0.111:3000';
// const BASE_URL = "http://localhost:3000";

export default function WorkerComplaintsListScreen({ navigation, route }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [workerId, setWorkerId] = useState(null);

useEffect(() => {
  (async () => {
    const wid = await AsyncStorage.getItem('worker_id');
    setWorkerId(wid);
  })();
}, []);
  const fetchComplaints = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {setRefreshing(true);}
      else {setLoading(true);}

      setError('');

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/show_complaint`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch complaints');
      }

      // Expected: { success: true, complaints: [{ complaint_id: 1005 }, ...] }
      setComplaints(Array.isArray(json.complaints) ? json.complaints : []);
    } catch (err) {
      console.log('show_complaint error:', err);
      const msg = err?.message || 'Something went wrong';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
   
    fetchComplaints();
  }, [fetchComplaints]);

  const renderItem = ({ item, index }) => {
    const complaintId = item?.complaint_id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('WorkerComplaintDetailsScreen', {
            complaint_id: complaintId,
          })
        }
      >
        <Text style={styles.cardTitle}>Complaint #{complaintId ?? '-'}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Complaint ID:</Text>
          <Text style={styles.value}>{complaintId ?? '-'}</Text>
        </View>

        <Text style={styles.tapHint}>Tap to view details →</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Complaints</Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={styles.debtBtn}
            onPress={() =>
             
              navigation.navigate('WorkerDebtScreen', {
                worker_id: workerId,
              })
            }
          >
            <Text style={styles.debtText}>Debt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reloadBtn} onPress={() => fetchComplaints()}>
            <Text style={styles.reloadText}>Reload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={complaints}
        keyExtractor={(item, index) => `${item?.complaint_id ?? 'x'}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={
          complaints.length === 0 ? styles.emptyWrap : { paddingBottom: 20 }
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchComplaints(true)}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No complaints assigned.</Text>
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
    backgroundColor: '#f6f7fb',
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

  // ✅ NEW (only for Debt button)
  debtBtn: {
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  debtText: {
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
  cardTitle: {
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