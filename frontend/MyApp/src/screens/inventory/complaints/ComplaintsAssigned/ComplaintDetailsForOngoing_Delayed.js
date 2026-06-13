// ComplaintDetails.js (Details + Toggle Delayed/Ongoing button)
import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL } from '../../../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../../theme';
import { Screen, AppBar, Card, Field, Button, StatusPill, Skeleton, EmptyState, useToast } from '../../../../components/ui';

export default function ComplaintDetailsScreenForOngoing_Delayed() {
  const route = useRoute();
  const navigation = useNavigation();
  const complaint_id = route?.params?.complaint_id;
  const { colors, getRoleAccent } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [item, setItem] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      if (!complaint_id) { toast.error('complaint_id missing'); return; }
      const token = await AsyncStorage.getItem('token');
      if (!token) { toast.warning('Token missing. Please login again.'); return; }

      const res = await fetch(`${BASE_URL}/api/assigned_details/${complaint_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      let json = {};
      try { json = await res.json(); } catch { json = {}; }
      if (!res.ok || json?.success === false) { toast.error(json?.message || 'Failed to load complaint details'); return; }
      setItem(json?.data || null);
    } catch (e) {
      console.log('fetchDetails error:', e);
      toast.error('Backend not reachable');
    }
  }, [complaint_id, toast]);

  useEffect(() => {
    (async () => { try { await fetchDetails(); } finally { setLoading(false); } })();
  }, [fetchDetails]);

  const onRefresh = async () => { setRefreshing(true); try { await fetchDetails(); } finally { setRefreshing(false); } };

  const isToggleAllowed = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'ongoing' || s === 'delayed';
  };
  const getToggleButtonLabel = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'delayed') return 'Change to Ongoing';
    if (s === 'ongoing') return 'Change to Delayed';
    return 'Status Toggle Not Allowed';
  };

  const toggleComplaintStatus = async () => {
    try {
      if (!item?.complaint_id) { toast.error('Complaint ID not found'); return; }
      if (!isToggleAllowed(item.status)) { toast.info('Only ongoing/delayed complaints can be toggled.'); return; }
      if (toggling) return;
      setToggling(true);

      const token = await AsyncStorage.getItem('token');
      if (!token) { toast.warning('Token missing. Please login again.'); return; }

      const res = await fetch(`${BASE_URL}/api/toggle_complaint_status/${item.complaint_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      let json = {};
      try { json = await res.json(); } catch { json = {}; }
      if (!res.ok || json?.success === false) { toast.error(json?.message || 'Failed to toggle complaint status'); return; }

      const backendStatus = json?.data?.status ?? json?.status ?? json?.data?.complaint?.status ?? null;
      setItem((prev) => {
        if (!prev) return prev;
        const current = String(prev.status || '').toLowerCase();
        const fallbackNext = current === 'delayed' ? 'ongoing' : current === 'ongoing' ? 'delayed' : current;
        return { ...prev, status: backendStatus || fallbackNext };
      });
    } catch (e) {
      console.log('toggleComplaintStatus error:', e);
      toast.error('Could not toggle complaint status');
    } finally {
      setToggling(false);
    }
  };

  const header = <AppBar title="Complaint Details" subtitle="Inventory" role="inventory" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header} scroll>
        <Card>
          <Skeleton width={'40%'} height={20} />
          <Skeleton width={'70%'} height={14} style={{ marginTop: 14 }} />
          <Skeleton width={'90%'} height={14} style={{ marginTop: 10 }} />
        </Card>
      </Screen>
    );
  }

  if (!item) {
    return (
      <Screen header={header}>
        <EmptyState icon="clipboard" title="No complaint details found" actionLabel="Retry" onAction={fetchDetails} />
      </Screen>
    );
  }

  const canToggle = isToggleAllowed(item.status);

  return (
    <Screen header={header} scroll onRefresh={onRefresh} refreshing={refreshing}>
      <Card style={{ marginBottom: 16 }} accentBar={getRoleAccent('inventory').color}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>COMPLAINT</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 2 }}>#{item.complaint_id}</Text>
          </View>
          <StatusPill status={item.status} />
        </View>
        <Button
          title={toggling ? 'Changing…' : getToggleButtonLabel(item.status)}
          icon="refresh"
          variant="secondary"
          onPress={toggleComplaintStatus}
          loading={toggling}
          disabled={!canToggle}
        />
      </Card>

      <Card>
        <Field label="Phone" value={item.phone_number} />
        <Field label="Address" value={item.address} />
        <Field label="Description" value={item.description} />
        <Field label="Worker ID" value={item.worker_id != null ? String(item.worker_id) : '—'} last />
      </Card>
    </Screen>
  );
}
