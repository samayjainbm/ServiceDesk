import React, { useCallback, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// const BASE_URL = 'http://192.168.0.111:3000';
// const TOKEN_KEY = 'token'; // ✅ ONLY ONE TOKEN NAME

export default function UserComplaintsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);

  const authHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) {setLoading(true);}

      const res = await fetch(`${BASE_URL}/api/show_complaint_id`, {
        method: 'GET',
        headers: await authHeaders(),
      });

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error(`Non-JSON response (HTTP ${res.status})`); }

      if (!res.ok || data?.success === false) {throw new Error(data?.message || `HTTP ${res.status}`);}

      setItems(Array.isArray(data?.complaints) ? data.complaints : []);
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('not logged')) {
        Alert.alert('Warning', 'Not logged in. Please login again.');
        navigation.reset({ index: 0, routes: [{ name: 'UserLoginScreen' }] });
        return;
      }
      Alert.alert('Error', e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders, navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('UserComplaintDetailScreen', { complaintId: String(item.complaint_id) })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.id}>Complaint ID: {item.complaint_id}</Text>
        <Text style={styles.status}>Status: {item.status}</Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading complaints...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Complaints</Text>
      <FlatList
        data={items}
        keyExtractor={(it, idx) => String(it.complaint_id ?? idx)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : { paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No complaints found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 14 },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#f9fafb', flexDirection: 'row', alignItems: 'center' },
  id: { fontWeight: '900', color: '#111827', marginBottom: 4 },
  status: { color: '#4b5563' },
  chev: { fontSize: 28, color: '#9ca3af', marginLeft: 8, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  muted: { marginTop: 8, color: '#6b7280' },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#6b7280' },
});
