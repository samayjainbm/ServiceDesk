// src/screens/pa/PAWorkerListScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Avatar, Icon, Input, SkeletonList, EmptyState, useToast } from '../../../components/ui';

export default function PAWorkerListScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');
    if (!token) { throw new Error('NOT_LOGGED_IN'); }
    const res = await fetch(`${BASE_URL}/api/pa/workers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 403) { throw new Error('NOT_LOGGED_IN'); }
    if (!res.ok) { throw new Error(data?.message || `HTTP ${res.status}`); }
    setItems(Array.isArray(data) ? data : data?.data || []);
  }, []);

  const handleErr = useCallback((e) => {
    if (e?.message === 'NOT_LOGGED_IN') {
      toast.warning('Not logged in');
      navigation.reset({ index: 0, routes: [{ name: 'PALoginScreen' }] });
      return;
    }
    toast.error(e?.message || 'Failed to load workers');
  }, [navigation, toast]);

  useEffect(() => {
    (async () => { try { setLoading(true); await load(); } catch (e) { handleErr(e); } finally { setLoading(false); } })();
  }, [load, handleErr]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } catch (e) { handleErr(e); } finally { setRefreshing(false); }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((w) => {
      const id = String(w.worker_id ?? '');
      const name = String(w.name ?? w.worker_name ?? '');
      const phone = String(w.worker_phone_number ?? w.phone_number ?? '');
      const des = String(w.designation ?? '');
      return id.includes(s) || name.toLowerCase().includes(s) || phone.includes(s) || des.toLowerCase().includes(s);
    });
  }, [q, items]);

  const renderItem = ({ item }) => {
    const id = item.worker_id;
    const name = item.name ?? item.worker_name ?? '-';
    const phone = item.worker_phone_number ?? item.phone_number ?? '-';
    const des = item.designation ?? '-';
    return (
      <Card onPress={() => navigation.navigate('PAWorkerDetailScreen', { workerId: id })} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={name} role="pa" size={44} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>{name} <Text style={{ color: colors.textMuted, fontWeight: '600' }}>#{id}</Text></Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{phone} • {des}</Text>
          </View>
          <Icon name="chevronRight" size={22} color={colors.textMuted} />
        </View>
      </Card>
    );
  };

  const header = <AppBar title="All Workers" subtitle="Administration" role="pa" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header}>
        <View style={{ padding: 16 }}>
          <SkeletonList count={6} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={header} padded={false} scroll={false}>
      <FlatList
        data={filtered}
        keyExtractor={(it, idx) => String(it.worker_id ?? idx)}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <Input leftIcon="search" placeholder="Search id / name / phone / designation" value={q} onChangeText={setQ} style={{ marginBottom: 12 }} />
        }
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="users" title="No workers found" subtitle="Try a different search, or create a worker." />}
      />
    </Screen>
  );
}
