// src/screens/pa/PAWorkerListScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000';

export default function PAWorkerListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');

    if (!token) {throw new Error('NOT_LOGGED_IN');}

    const res = await fetch(`${BASE_URL}/api/pa/workers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 || res.status === 403) {throw new Error('NOT_LOGGED_IN');}
    if (!res.ok) {throw new Error(data?.message || `HTTP ${res.status}`);}

    const list = Array.isArray(data) ? data : data?.data || [];
    setItems(list);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e) {
        if (e?.message === 'NOT_LOGGED_IN') {
          Alert.alert('Error', 'Not logged in');
          navigation.reset({ index: 0, routes: [{ name: 'PALoginScreen' }] });
          return;
        }
        Alert.alert('Error', e?.message || 'Failed to load workers');
      } finally {
        setLoading(false);
      }
    })();
  }, [load, navigation]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) {return items;}
    return items.filter((w) => {
      const id = String(w.worker_id ?? '');
      const name = String(w.name ?? w.worker_name ?? '');
      const phone = String(w.worker_phone_number ?? w.phone_number ?? '');
      const des = String(w.designation ?? '');
      return id.includes(s) || name.toLowerCase().includes(s) || phone.includes(s) || des.toLowerCase().includes(s);
    });
  }, [q, items]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      if (e?.message === 'NOT_LOGGED_IN') {
        Alert.alert('Error', 'Not logged in');
        navigation.reset({ index: 0, routes: [{ name: 'PALoginScreen' }] });
      } else {
        Alert.alert('Error', e?.message || 'Refresh failed');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }) => {
    const id = item.worker_id;
    const name = item.name ?? item.worker_name ?? '-';
    const phone = item.worker_phone_number ?? item.phone_number ?? '-';
    const des = item.designation ?? '-';

    return (
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('PAWorkerDetailScreen', { workerId: id })}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{name} (ID: {id})</Text>
          <Text style={styles.rowSub}>📞 {phone}  •  {des}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading workers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Workers</Text>

      <TextInput value={q} onChangeText={setQ} placeholder="Search by id / name / phone / designation" style={styles.search} />

      <FlatList
        data={filtered}
        keyExtractor={(it, idx) => String(it.worker_id ?? idx)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30, color: '#6b7280' }}>No workers found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  search: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 14, marginBottom: 10, backgroundColor: '#f9fafb' },
  rowTitle: { fontSize: 16, fontWeight: '800' },
  rowSub: { marginTop: 4, color: '#6b7280' },
  chev: { fontSize: 28, marginLeft: 8, color: '#9ca3af' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
