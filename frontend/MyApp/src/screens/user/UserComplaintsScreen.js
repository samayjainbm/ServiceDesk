import React, { useCallback, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from '../../../config';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Avatar, Icon, StatusPill, SkeletonList, EmptyState, useToast } from '../../components/ui';

export default function UserComplaintsScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
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
      if (!silent) { setLoading(true); }

      const res = await fetch(`${BASE_URL}/api/show_complaint_id`, {
        method: 'GET',
        headers: await authHeaders(),
      });

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error(`Non-JSON response (HTTP ${res.status})`); }

      if (!res.ok || data?.success === false) { throw new Error(data?.message || `HTTP ${res.status}`); }

      setItems(Array.isArray(data?.complaints) ? data.complaints : []);
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('not logged')) {
        toast.warning('Not logged in. Please login again.');
        navigation.reset({ index: 0, routes: [{ name: 'UserLoginScreen' }] });
        return;
      }
      toast.error(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders, navigation, toast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const renderItem = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('UserComplaintDetailScreen', { complaintId: String(item.complaint_id) })}
      style={{ marginBottom: 12 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar icon="clipboard" role="user" size={44} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>
            Complaint #{item.complaint_id}
          </Text>
          <View style={{ marginTop: 8 }}>
            <StatusPill status={item.status} size="sm" />
          </View>
        </View>
        <Icon name="chevronRight" size={22} color={colors.textMuted} />
      </View>
    </Card>
  );

  return (
    <Screen
      header={<AppBar title="My Complaints" subtitle="MANIT ServiceDesk" role="user" onBack={() => navigation.goBack()} />}
      padded={false}
      scroll={false}
    >
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it, idx) => String(it.complaint_id ?? idx)}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="clipboard"
              title="No complaints yet"
              subtitle="Complaints you register will appear here. Pull down to refresh."
              actionLabel="Register a complaint"
              onAction={() => navigation.navigate('UserRegisterComplaintScreen')}
            />
          }
        />
      )}
    </Screen>
  );
}
