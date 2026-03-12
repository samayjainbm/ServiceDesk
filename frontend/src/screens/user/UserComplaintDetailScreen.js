// src/screens/user/UserComplaintDetailScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000';
// const TOKEN_KEY = 'token'; // ✅ ONLY ONE TOKEN NAME

export default function UserComplaintDetailScreen({ route, navigation }) {
  const complaintId = route?.params?.complaintId ? String(route.params.complaintId) : '';

  const [loading, setLoading] = useState(true);
  const [c, setC] = useState(null);

  const authHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!complaintId) return;

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/show_complaint_detail/${complaintId}`, {
        method: 'GET',
        headers: await authHeaders(),
      });

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error(`Non-JSON response (HTTP ${res.status})`); }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      setC(data?.complaint || null);
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.toLowerCase().includes('not logged')) {
        Alert.alert('Warning', 'Not logged in. Please login again.');
        navigation.reset({ index: 0, routes: [{ name: 'UserLoginScreen' }] });
        return;
      }
      Alert.alert('Error', msg || 'Failed to fetch detail');
    } finally {
      setLoading(false);
    }
  }, [complaintId, authHeaders, navigation]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ✅ NEW FLOW:
  // Resolve button अब POST /api/resolved/:id नहीं मारेगा
  // बल्कि items selector screen पर ले जाएगा
  const goToResolveItems = () => {
    if (!complaintId) return;
    navigation.navigate('UserResolveItemsScreen', { complaintId });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading detail...</Text>
      </View>
    );
  }

  if (!c) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No detail found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complaint Detail</Text>

      <View style={styles.box}>
        <Text style={styles.k}>Complaint ID</Text>
        <Text style={styles.v}>{c.complaint_id}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.k2}>Status:</Text>
        <Text style={styles.v2}>{c.status}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.k2}>Worker ID:</Text>
        <Text style={styles.v2}>{String(c.worker_id ?? 'null')}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.k2}>Phone:</Text>
        <Text style={styles.v2}>{c.phone_number}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.k2}>Address:</Text>
        <Text style={styles.v2}>{c.address}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.k2}>Description:</Text>
        <Text style={styles.v2}>{c.description}</Text>
      </View>

      {/* ✅ अब resolve सीधे POST नहीं करेगा, next page पर जाएगा */}
      <TouchableOpacity style={styles.btn} onPress={goToResolveItems}>
        <Text style={styles.btnText}>Resolve Complaint</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  muted: { marginTop: 8, color: '#6b7280' },

  container: { padding: 18, backgroundColor: '#fff', paddingBottom: 30 },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 12 },

  box: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  k: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  v: { color: '#1e3a8a', fontWeight: '900', fontSize: 18, marginTop: 2 },

  row: { flexDirection: 'row', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  k2: { fontWeight: '900', color: '#111827' },
  v2: { color: '#374151', flexShrink: 1 },

  btn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 18 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});