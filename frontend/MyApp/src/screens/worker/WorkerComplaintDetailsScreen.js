// screens/worker/WorkerComplaintDetailsScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL } from '../../../config';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Field, Button, StatusPill, Skeleton, EmptyState, useToast } from '../../components/ui';

export default function WorkerComplaintDetailsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaint_id ?? route?.params?.complaintId;
  const { colors, getRoleAccent } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [complaint, setComplaint] = useState(null);

  const formatDate = (value) => {
    if (!value) { return '-'; }
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) { return String(value); }
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch {
      return String(value);
    }
  };

  const fetchComplaintDetails = useCallback(async (isRefresh = false) => {
    if (!complaintId) { setLoading(false); return; }
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }

      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/complaint_detail/${complaintId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) {
        throw new Error(json.message || 'Failed to fetch complaint details');
      }
      setComplaint(json.complaint || null);
    } catch (err) {
      console.log('complaint_detail error:', err);
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId, toast]);

  useEffect(() => { fetchComplaintDetails(); }, [fetchComplaintDetails]);

  const handleDemandItems = () => {
    if (!complaintId) { toast.error('Complaint ID not found'); return; }
    navigation.navigate('WorkerDemandItemsScreen', { complaint_id: complaintId });
  };

  const header = <AppBar title="Complaint Details" subtitle="Worker" role="worker" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header} scroll>
        <Card>
          <Skeleton width={'40%'} height={20} />
          <Skeleton width={'70%'} height={14} style={{ marginTop: 14 }} />
          <Skeleton width={'90%'} height={14} style={{ marginTop: 10 }} />
          <Skeleton width={'80%'} height={14} style={{ marginTop: 10 }} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      scroll
      onRefresh={() => fetchComplaintDetails(true)}
      refreshing={refreshing}
      footer={
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Button title="Demand Items" icon="box" onPress={handleDemandItems} disabled={!complaint} />
        </View>
      }
    >
      {!complaint ? (
        <EmptyState icon="clipboard" title="No complaint details found" />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }} accentBar={getRoleAccent('worker').color}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>COMPLAINT</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 2 }}>#{complaint.complaint_id}</Text>
              </View>
              <StatusPill status={complaint.status} />
            </View>
          </Card>

          <Card>
            <Field label="Phone" value={complaint.phone_number} />
            <Field label="Description" value={complaint.description} />
            <Field label="Address" value={complaint.address} />
            <Field label="Start Date" value={formatDate(complaint.start_date)} last />
          </Card>
        </>
      )}
    </Screen>
  );
}
