// frontend/screens/worker/workerDebtScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL } from '../../../config';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, MetricCard, Badge, SkeletonList, EmptyState, useToast } from '../../components/ui';

const API_BASE = BASE_URL;

export default function WorkerDebtScreen({ route, navigation }) {
  const workerIdFromParams = route?.params?.worker_id;
  const { colors } = useTheme();
  const toast = useToast();

  const [workerId, setWorkerId] = useState(workerIdFromParams);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);

  const fetchDebt = useCallback(async ({ isRefresh = false } = {}) => {
    try {
      if (!workerId) {
        toast.error('worker_id missing. Pass it in navigation params.');
        setData(null);
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true); else setLoading(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        toast.error('Token missing. Please login again.');
        setData(null);
        return;
      }

      const res = await fetch(`${API_BASE}/api/worker/debt/${workerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.message || 'Failed to fetch debt');
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      toast.error(e?.message || 'Something went wrong');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workerId, toast]);

  useEffect(() => { setWorkerId(workerIdFromParams); }, [workerIdFromParams]);
  useEffect(() => { fetchDebt(); }, [fetchDebt]);

  const renderItem = ({ item }) => (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
          <Text style={{ color: colors.primary, fontWeight: '900' }}>{String(item.item_name).slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' }}>{item.item_name}</Text>
        <Badge label={`${item.count}`} color={colors.accent} tint={colors.accentTint} />
      </View>
    </Card>
  );

  const header = <AppBar title="Material Debt" subtitle={workerId ? `Worker #${workerId}` : 'Worker'} role="worker" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header}>
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={header} padded={false} scroll={false}>
      <FlatList
        data={data?.items || []}
        keyExtractor={(item, idx) => `${item.item_name}-${idx}`}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDebt({ isRefresh: true })} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          data ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <MetricCard label="Non-zero items" value={data.total_non_zero_items ?? 0} icon="list" accent={colors.primary} />
                <MetricCard label="Total count" value={data.total_count ?? 0} icon="box" accent={colors.accent} />
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState icon="checkCircle" title="No pending debt" subtitle="This worker has returned all materials." />}
      />
    </Screen>
  );
}
