import React, { useCallback, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// const BASE_URL = 'http://192.168.0.111:3000';

export default function PAUserListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const parseSafely = useCallback(async (res) => {
    const raw = await res.text();
    try {
      return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true };
    } catch {
      return { data: null, raw, isJson: false };
    }
  }, []);

  const loadUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const res = await fetch(`${BASE_URL}/api/pa/users`, {
        method: 'GET',
        headers: await getAuthHeaders(),
      });

      const parsed = await parseSafely(res);

      if (!parsed.isJson) {
        throw new Error(`Server returned non-JSON response (HTTP ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(parsed.data?.message || `HTTP ${res.status}`);
      }

      const list = Array.isArray(parsed.data?.data) ? parsed.data.data : [];
      setUsers(list);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders, parseSafely]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PAUserDetailScreen', { userId: String(item.user_id) })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.user_name || 'No Name'}</Text>
        <Text style={styles.meta}>ID: {item.user_id}</Text>
        <Text style={styles.meta}>Phone: {item.phone_number || '-'}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          Address: {item.user_address || '-'}
        </Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>All Users</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('PAUserCreateScreen')}>
          <Text style={styles.createBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item, index) => String(item.user_id ?? index)}
        renderItem={renderItem}
        contentContainerStyle={users.length === 0 ? styles.emptyWrap : { paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 14 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111827' },

  createBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  createBtnText: { color: '#fff', fontWeight: '800' },

  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 4 },
  meta: { color: '#4b5563', fontSize: 13, marginBottom: 2 },
  chevron: { fontSize: 28, color: '#9ca3af', marginLeft: 8, fontWeight: '700' },

  emptyWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6b7280', fontSize: 15 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 8, color: '#6b7280' },
});