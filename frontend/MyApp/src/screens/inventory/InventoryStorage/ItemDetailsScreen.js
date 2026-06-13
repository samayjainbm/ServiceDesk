// screens/ItemDetailsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, MetricCard, Avatar, Badge, SkeletonList, EmptyState, useToast } from '../../../components/ui';

export default function ItemDetailsScreen({ route, navigation }) {
  const { itemName } = route.params || {};
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState(null);

  const fetchItemDetail = useCallback(async (isRefresh = false) => {
    if (!itemName) { setLoading(false); setDetail(null); return; }
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const url = `${BASE_URL}/api/debt?name_of_material=${encodeURIComponent(itemName)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || 'Failed to fetch item details'); }
      setDetail(data);
    } catch (err) {
      console.error('fetchItemDetail error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [itemName, toast]);

  useEffect(() => { fetchItemDetail(); }, [fetchItemDetail]);

  const renderWorkerDebt = ({ item }) => (
    <Card style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={item.worker_name} role="inventory" size={42} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>{item.worker_name || 'Unknown Worker'}</Text>
          <Text style={{ marginTop: 2, fontSize: 13, color: colors.textSecondary }}>ID: {item.worker_id}</Text>
        </View>
        <Badge label={`Debt ${item.debt_count ?? 0}`} color={colors.accent} tint={colors.accentTint} />
      </View>
    </Card>
  );

  const header = <AppBar title="Item Details" subtitle={itemName ? String(itemName).toUpperCase() : 'Inventory'} role="inventory" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header}>
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen header={header}>
        <EmptyState icon="box" title="No details found" />
      </Screen>
    );
  }

  const Head = (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
        <MetricCard label="In Stock" value={detail.inventory_total ?? 0} icon="box" accent={colors.primary} />
        <MetricCard label="In Debt" value={detail.total_workers_in_debt ?? 0} icon="users" accent={colors.accent} />
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginTop: 16 }}>WORKERS IN DEBT</Text>
    </View>
  );

  return (
    <Screen header={header} padded={false} scroll={false}>
      <FlatList
        data={Array.isArray(detail.data) ? detail.data : []}
        keyExtractor={(item, index) => `${item.worker_id}-${index}`}
        renderItem={renderWorkerDebt}
        ListHeaderComponent={Head}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchItemDetail(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="checkCircle" title="No debt" subtitle="No workers currently in debt for this item." compact />}
      />
    </Screen>
  );
}
