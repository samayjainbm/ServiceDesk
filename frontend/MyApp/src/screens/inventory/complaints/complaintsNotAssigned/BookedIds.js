import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, TOKEN_KEY } from '../../../../../config';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../theme';
import { Screen, AppBar, Card, Avatar, Icon, StatusPill, SkeletonList, EmptyState, useToast } from '../../../../components/ui';

export default function BookedIdsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);

  const fetchBookedIds = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        toast.warning('Token missing. Please login again.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/booked_ids`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        toast.error(json?.message || 'Failed to load booked ids');
        setItems([]);
        return;
      }
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      console.log('fetchBookedIds error:', e);
      toast.error('Backend not reachable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBookedIds(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookedIds();
  };

  const renderCard = ({ item }) => (
    <Card onPress={() => navigation.navigate('ComplaintDetails', { complaint_id: item.complaint_id })} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar icon="clipboard" role="inventory" size={44} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>Complaint #{item.complaint_id}</Text>
          <View style={{ marginTop: 8 }}>
            <StatusPill status="booked" size="sm" />
          </View>
        </View>
        <Icon name="chevronRight" size={22} color={colors.textMuted} />
      </View>
    </Card>
  );

  return (
    <Screen header={<AppBar title="Not Assigned" subtitle="Booked complaints" role="inventory" onBack={() => navigation.goBack()} />} padded={false} scroll={false}>
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.complaint_id)}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="clipboard" title="No booked complaints" subtitle="Unassigned complaints will appear here." />}
        />
      )}
    </Screen>
  );
}
