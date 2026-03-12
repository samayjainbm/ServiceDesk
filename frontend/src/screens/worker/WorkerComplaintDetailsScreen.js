// screens/worker/WorkerComplaintDetailsScreen.js
import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ same setup as your app
// const BASE_URL = 'http://192.168.0.111:3000';
// const BASE_URL = "http://localhost:3000";

export default function WorkerComplaintDetailsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaint_id ?? route?.params?.complaintId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [complaint, setComplaint] = useState(null);

  const formatDate = (value) => {
    if (!value) {
      return '-';
    }
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        return String(value);
      }
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch {
      return String(value);
    }
  };

  const fetchComplaintDetails = useCallback(async (isRefresh = false) => {
    if (!complaintId) {
      setError('complaint_id not provided');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/complaint_detail/${complaintId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch complaint details');
      }

      setComplaint(json.complaint || null);
    } catch (err) {
      console.log('complaint_detail error:', err);
      const msg = err?.message || 'Something went wrong';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  // ✅ UPDATED: direct POST nahi, new screen pe navigate
  const handleDemandItems = useCallback(() => {
    if (!complaintId) {
      Alert.alert('Error', 'Complaint ID not found');
      return;
    }

    navigation.navigate('WorkerDemandItemsScreen', {
      complaint_id: complaintId,
    });
  }, [complaintId, navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading complaint details...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchComplaintDetails(true)}
          />
        }
      >
        <Text style={styles.pageTitle}>Complaint Details</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!complaint ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No complaint details found.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Complaint Info</Text>

            <View style={styles.row}>
              <Text style={styles.label}>Complaint ID</Text>
              <Text style={styles.value}>{complaint.complaint_id ?? '-'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Phone Number</Text>
              <Text style={styles.value}>{complaint.phone_number ?? '-'}</Text>
            </View>

            <View style={styles.rowColumn}>
              <Text style={styles.labelBlock}>Description</Text>
              <Text style={styles.descValue}>{complaint.description ?? '-'}</Text>
            </View>

            <View style={styles.rowColumn}>
              <Text style={styles.labelBlock}>Address</Text>
              <Text style={styles.descValue}>{complaint.address ?? '-'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <Text
                style={[
                  styles.badge,
                  complaint.status === 'ongoing'
                    ? styles.badgeOngoing
                    : complaint.status === 'delayed'
                    ? styles.badgeDelayed
                    : styles.badgeDefault,
                ]}
              >
                {complaint.status ?? '-'}
              </Text>
            </View>

            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Start Date</Text>
              <Text style={styles.value}>{formatDate(complaint.start_date)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.demandBtn, !complaint && styles.disabledBtn]}
          onPress={handleDemandItems}
          disabled={!complaint}
          activeOpacity={0.85}
        >
          <Text style={styles.demandBtnText}>Demand Items</Text>
        </TouchableOpacity>
      </View>
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
  loadingText: {
    marginTop: 10,
    color: '#374151',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
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
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f3',
  },
  rowColumn: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f3',
  },
  label: {
    width: 110,
    color: '#4b5563',
    fontWeight: '600',
  },
  labelBlock: {
    color: '#4b5563',
    fontWeight: '600',
    marginBottom: 6,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: '#111827',
    fontWeight: '700',
  },
  descValue: {
    color: '#111827',
    fontWeight: '500',
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontWeight: '700',
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  badgeOngoing: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeDelayed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgeDefault: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
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
  demandBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  demandBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});