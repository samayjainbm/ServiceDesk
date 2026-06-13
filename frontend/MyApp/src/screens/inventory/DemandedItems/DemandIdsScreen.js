// DemandIdsScreen.js
import { BASE_URL } from '../../../../config';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Avatar, Icon, SkeletonList, EmptyState, useToast } from '../../../components/ui';

export default function DemandIdsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDemandIds = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }

      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/demand_ids`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || data.success === false) { throw new Error(data.message || 'Failed to fetch demand ids'); }
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.log('fetchDemandIds error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchDemandIds(); }, [fetchDemandIds]);

  const renderItem = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('DemandItemDetailsScreen', { complaint_id: item.complaint_id, worker_id: item.worker_id, name: item.name })}
      style={{ marginBottom: 12 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={item.name} icon="user" role="inventory" size={44} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>{item.name || 'Unknown Worker'}</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
            Worker #{item.worker_id} • Complaint #{item.complaint_id}
          </Text>
        </View>
        <Icon name="chevronRight" size={22} color={colors.textMuted} />
      </View>
    </Card>
  );

  return (
    <Screen header={<AppBar title="Demanded Items" subtitle="Material requests" role="inventory" onBack={() => navigation.goBack()} />} padded={false} scroll={false}>
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.worker_id}-${item.complaint_id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchDemandIds(true)} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="list" title="No demand items" subtitle="Material requests from workers will appear here." />}
        />
      )}
    </Screen>
  );
}
