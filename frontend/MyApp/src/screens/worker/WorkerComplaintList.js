// screens/worker/WorkerComplaintsListScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL } from '../../../config';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Avatar, Icon, Button, SkeletonList, EmptyState, useToast } from '../../components/ui';
import { clearSession } from '../../hooks/useAuth';

export default function WorkerComplaintsListScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workerId, setWorkerId] = useState(null);

  useEffect(() => {
    (async () => {
      const wid = await AsyncStorage.getItem('worker_id');
      setWorkerId(wid);
    })();
  }, []);

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }

      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/show_complaint`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch complaints');
      }
      setComplaints(Array.isArray(json.complaints) ? json.complaints : []);
    } catch (err) {
      console.log('show_complaint error:', err);
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const logout = async () => {
    await clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const renderItem = ({ item }) => {
    const complaintId = item?.complaint_id;
    return (
      <Card onPress={() => navigation.navigate('WorkerComplaintDetailsScreen', { complaint_id: complaintId })} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar icon="clipboard" role="worker" size={44} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>Complaint #{complaintId ?? '-'}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Tap to view details</Text>
          </View>
          <Icon name="chevronRight" size={22} color={colors.textMuted} />
        </View>
      </Card>
    );
  };

  const right = (
    <Pressable onPress={logout} hitSlop={10} accessibilityLabel="Log out" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="logout" size={22} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Screen
      header={<AppBar title="My Tasks" subtitle={workerId ? `Worker #${workerId}` : 'MANIT ServiceDesk'} role="worker" right={right} />}
      padded={false}
      scroll={false}
    >
      {loading ? (
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item, index) => `${item?.complaint_id ?? 'x'}-${index}`}
          renderItem={renderItem}
          ListHeaderComponent={
            <Button
              title="Material Debt"
              variant="secondary"
              icon="box"
              onPress={() => navigation.navigate('WorkerDebtScreen', { worker_id: workerId })}
              style={{ marginBottom: 16 }}
            />
          }
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchComplaints(true)} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={<EmptyState icon="clipboard" title="No tasks assigned" subtitle="Complaints assigned to you will appear here. Pull to refresh." />}
        />
      )}
    </Screen>
  );
}
