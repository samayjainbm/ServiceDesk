// AssignWorkerScreen.js
import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../../../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../../theme';
import { Screen, AppBar, Card, Avatar, Icon, Button, SkeletonList, EmptyState, useToast } from '../../../../components/ui';

export default function AssignWorkerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { complaint_id } = route.params || {};
  const { colors, getRoleAccent } = useTheme();
  const toast = useToast();
  const accent = getRoleAccent('inventory').color;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadWorkers = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      toast.warning('Token missing. Please login again.');
      return null;
    }
    const res = await fetch(`${BASE_URL}/api/show_worker_to_assign`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || 'Failed to fetch workers');
    }
    return Array.isArray(json.data) ? json.data : [];
  };

  const assignWorker = async () => {
    try {
      if (!selected?.worker_id) { return toast.warning('Please select a worker first.'); }
      const token = await AsyncStorage.getItem('token');
      if (!token) { return toast.warning('Token missing. Please login again.'); }

      setAssigning(true);
      const url = `${BASE_URL}/api/assign_worker/${complaint_id}/confirm/${selected.worker_id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        return toast.error(json?.message || 'Could not assign worker');
      }
      toast.success(json?.message || 'Worker assigned successfully!');
      navigation.goBack();
    } catch (e) {
      console.log('assignWorker error:', e);
      toast.error('Backend not reachable');
    } finally {
      setAssigning(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (!complaint_id) { toast.error('complaint_id missing'); setLoading(false); return; }
        const list = await loadWorkers();
        if (list) setWorkers(list);
      } catch (e) {
        toast.error(e?.message || 'Backend not reachable');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaint_id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const list = await loadWorkers();
      if (list) setWorkers(list);
    } catch (e) {
      toast.error(e?.message || 'Backend not reachable');
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selected?.worker_id === item.worker_id;
    const name = item.worker?.name || '—';
    const designation = item.worker?.designation || '—';
    const tasks = item.alloted_task ?? 0;

    return (
      <Card
        onPress={() => setSelected(item)}
        style={{ marginBottom: 12, borderColor: isSelected ? accent : colors.border, borderWidth: isSelected ? 2 : 1 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={name} role="inventory" size={44} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>{name}</Text>
            <Text style={{ marginTop: 2, fontSize: 13, fontWeight: '600', color: colors.textSecondary, textTransform: 'capitalize' }}>{designation}</Text>
          </View>
          <View style={{ alignItems: 'center', minWidth: 64 }}>
            {isSelected ? (
              <Icon name="checkCircle" size={24} color={accent} />
            ) : (
              <>
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted }}>TASKS</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.textPrimary }}>{tasks}</Text>
              </>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const header = <AppBar title="Assign Worker" subtitle={`Complaint #${complaint_id}`} role="inventory" onBack={() => navigation.goBack()} />;

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
    <Screen
      header={header}
      padded={false}
      scroll={false}
      footer={
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 10 }} numberOfLines={1}>
            {selected ? `Selected: ${selected.worker?.name} • ID ${selected.worker_id}` : 'Select a worker to assign'}
          </Text>
          <Button title="Assign Task" icon="check" onPress={assignWorker} loading={assigning} disabled={!selected} accent={accent} />
        </View>
      }
    >
      <FlatList
        data={workers}
        keyExtractor={(it) => String(it.worker_id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={<EmptyState icon="users" title="No workers found" subtitle="There are no workers available to assign." />}
      />
    </Screen>
  );
}
