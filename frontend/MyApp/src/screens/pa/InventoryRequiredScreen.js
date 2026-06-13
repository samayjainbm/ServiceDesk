// src/screens/InventoryRequiredScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY } from '../../../config';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Badge, MetricCard, SkeletonList, EmptyState, useToast } from '../../components/ui';

export default function InventoryRequiredScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getToken = async () => {
    const possibleKeys = [TOKEN_KEY, 'token', 'pa_token', 'auth_token'].filter(Boolean);
    for (const key of possibleKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) return value;
    }
    return null;
  };

  const fetchDemandStock = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const token = await getToken();
      if (!token) { toast.warning('Not logged in. Please login again.'); setRows([]); return; }

      const res = await fetch(`${BASE_URL}/api/get_demandstock`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) { throw new Error(data.message || data.error || 'Failed to fetch demand stock'); }
      setRows(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('fetchDemandStock error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchDemandStock(); }, [fetchDemandStock]);

  const groupedData = useMemo(() => {
    const groupedMap = new Map();
    rows.forEach((item) => {
      const rawDate = item.date ? new Date(item.date) : null;
      const dateKey = rawDate && !Number.isNaN(rawDate.getTime()) ? rawDate.toISOString().slice(0, 10) : 'Unknown Date';
      if (!groupedMap.has(dateKey)) groupedMap.set(dateKey, []);
      groupedMap.get(dateKey).push(item);
    });
    return Array.from(groupedMap.entries()).map(([date, items]) => ({ date, items }));
  }, [rows]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Unknown Date') return dateString;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderDateGroup = ({ item }) => (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.textPrimary }}>{formatDate(item.date)}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>{item.items.length} item(s)</Text>
      </View>
      {item.items.map((sub, index) => (
        <Card key={`${sub.date}-${sub.item_id}-${sub.item_name}-${index}`} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{sub.item_name}</Text>
              <Text style={{ marginTop: 2, fontSize: 13, color: colors.textMuted }}>Item ID: {sub.item_id}</Text>
            </View>
            <Badge label={`Required ${sub.count}`} color={colors.warning} tint={colors.warningTint} />
          </View>
        </Card>
      ))}
    </View>
  );

  const header = <AppBar title="Inventory Required" subtitle="Administration" role="pa" onBack={() => navigation.goBack()} />;

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
        data={groupedData}
        keyExtractor={(item) => item.date}
        renderItem={renderDateGroup}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDemandStock(true)} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            <MetricCard label="Total entries" value={rows.length} icon="list" accent={colors.primary} />
          </View>
        }
        ListEmptyComponent={<EmptyState icon="box" title="No demand stock" subtitle="Required inventory entries will appear here." />}
      />
    </Screen>
  );
}
