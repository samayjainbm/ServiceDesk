import React, { useCallback, useState } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Avatar, Icon, SkeletonList, EmptyState, useToast } from '../../../components/ui';

export default function PAUserListScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  const parseSafely = useCallback(async (res) => {
    const raw = await res.text();
    try { return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true }; }
    catch { return { data: null, raw, isJson: false }; }
  }, []);

  const loadUsers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${BASE_URL}/api/pa/users`, { method: 'GET', headers: await getAuthHeaders() });
      const parsed = await parseSafely(res);
      if (!parsed.isJson) { throw new Error(`Server returned non-JSON response (HTTP ${res.status})`); }
      if (!res.ok) { throw new Error(parsed.data?.message || `HTTP ${res.status}`); }
      setUsers(Array.isArray(parsed.data?.data) ? parsed.data.data : []);
    } catch (e) {
      toast.error(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getAuthHeaders, parseSafely, toast]);

  useFocusEffect(useCallback(() => { loadUsers(); }, [loadUsers]));

  const onRefresh = () => { setRefreshing(true); loadUsers(true); };

  const renderItem = ({ item }) => (
    <Card onPress={() => navigation.navigate('PAUserDetailScreen', { userId: String(item.user_id) })} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={item.user_name} role="pa" size={44} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>{item.user_name || 'No Name'} <Text style={{ color: colors.textMuted, fontWeight: '600' }}>#{item.user_id}</Text></Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{item.phone_number || '-'} • {item.user_address || '-'}</Text>
        </View>
        <Icon name="chevronRight" size={22} color={colors.textMuted} />
      </View>
    </Card>
  );

  const right = (
    <Pressable onPress={() => navigation.navigate('PAUserCreateScreen')} hitSlop={10} accessibilityLabel="Create user" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="plus" size={24} color="#FFFFFF" />
    </Pressable>
  );

  const header = <AppBar title="All Users" subtitle="Administration" role="pa" onBack={() => navigation.goBack()} right={right} />;

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
        data={users}
        keyExtractor={(item, index) => String(item.user_id ?? index)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="users" title="No users found" subtitle="Create a user to get started." actionLabel="Create User" onAction={() => navigation.navigate('PAUserCreateScreen')} />}
      />
    </Screen>
  );
}
