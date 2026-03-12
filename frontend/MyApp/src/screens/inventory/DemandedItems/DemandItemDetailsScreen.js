// screens/DemandItemDetailsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
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

// ✅ Jaisa tera setup hai waise hi rehne de
// const BASE_URL = 'http://192.168.0.111:3000';
// const BASE_URL = "http://localhost:3000";

export default function DemandItemDetailsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaint_id ?? route?.params?.complaintId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  // ✅ button loading states
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchDetails = useCallback(async (isRefresh = false) => {
    if (!complaintId) {
      setError('complaint_id not provided');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {setRefreshing(true);}
      else {setLoading(true);}

      setError('');

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(`${BASE_URL}/api/demand_details/${complaintId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch demand details');
      }

      setDetails(json.data || null);
    } catch (err) {
      console.log('Demand details fetch error:', err);
      const msg = err?.message || 'Something went wrong';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const itemsArray = useMemo(() => {
    const obj = details?.itemss || {};
    return Object.entries(obj);
  }, [details]);

  // ✅ ACCEPT API: POST /api/materialGiven/:complaint_id
  const handleAccept = useCallback(async () => {
    if (!details?.complaint_id) {
      Alert.alert('Error', 'Complaint ID not found');
      return;
    }

    try {
      setAcceptLoading(true);

      const token = await AsyncStorage.getItem('token');

      const res = await fetch(
        `${BASE_URL}/api/materialGiven/${details.complaint_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          // screenshot me no body hai
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to accept demand request');
      }

      Alert.alert(
        'Success',
        json.message || 'Material given successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              // ✅ optional: list page pe wapas ja sakta hai
              if (navigation?.goBack) {navigation.goBack();}
            },
          },
        ]
      );
    } catch (err) {
      console.log('Accept demand error:', err);
      Alert.alert('Error', err?.message || 'Failed to accept demand request');
    } finally {
      setAcceptLoading(false);
    }
  }, [details, navigation]);

  // ✅ REJECT API: POST /api/reject_demand_request
  // body me complaint_id + worker_id bhejenge (screenshot response se ye expected lag raha)
  const handleReject = useCallback(async () => {
    if (!details?.complaint_id || !details?.worker_id) {
      Alert.alert('Error', 'Complaint ID / Worker ID missing');
      return;
    }

    Alert.alert(
      'Reject Demand',
      'Are you sure you want to reject this demand request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setRejectLoading(true);

              const token = await AsyncStorage.getItem('token');

              const res = await fetch(`${BASE_URL}/api/reject_demand_request`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  complaint_id: details.complaint_id,
                  worker_id: details.worker_id,
                }),
              });

              const json = await res.json().catch(() => ({}));

              if (!res.ok || json.success === false) {
                throw new Error(json.message || 'Failed to reject demand request');
              }

              Alert.alert(
                'Success',
                json.message || 'Demand request rejected successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (navigation?.goBack) {navigation.goBack();}
                    },
                  },
                ]
              );
            } catch (err) {
              console.log('Reject demand error:', err);
              Alert.alert('Error', err?.message || 'Failed to reject demand request');
            } finally {
              setRejectLoading(false);
            }
          },
        },
      ]
    );
  }, [details, navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }} // ✅ space for bottom buttons
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDetails(true)}
          />
        }
      >
        <Text style={styles.pageTitle}>Demand Item Details</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!details ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No details found.</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Basic Info</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Complaint ID</Text>
                <Text style={styles.value}>{details.complaint_id ?? '-'}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Worker ID</Text>
                <Text style={styles.value}>{details.worker_id ?? '-'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Items</Text>

              {itemsArray.length === 0 ? (
                <Text style={styles.emptyText}>No items available.</Text>
              ) : (
                itemsArray.map(([key, qty]) => (
                  <View key={key} style={styles.itemRow}>
                    <Text style={styles.itemKey}>{key.toUpperCase()}</Text>
                    <Text style={styles.itemQty}>Qty: {qty}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ✅ Bottom action buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.rejectBtn,
            (rejectLoading || acceptLoading) && styles.disabledBtn,
          ]}
          onPress={handleReject}
          activeOpacity={0.85}
          disabled={rejectLoading || acceptLoading || !details}
        >
          <Text style={styles.actionText}>
            {rejectLoading ? 'Rejecting...' : 'Reject'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.acceptBtn,
            (acceptLoading || rejectLoading) && styles.disabledBtn,
          ]}
          onPress={handleAccept}
          activeOpacity={0.85}
          disabled={acceptLoading || rejectLoading || !details}
        >
          <Text style={styles.actionText}>
            {acceptLoading ? 'Accepting...' : 'Accept'}
          </Text>
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
    marginBottom: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f1f3',
  },
  label: {
    color: '#4b5563',
    fontWeight: '600',
  },
  value: {
    color: '#111827',
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#eef0f3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  itemKey: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },

  // ✅ bottom buttons
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#f6f7fb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  rejectBtn: {
    backgroundColor: '#dc2626',
  },
  acceptBtn: {
    backgroundColor: '#16a34a',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
