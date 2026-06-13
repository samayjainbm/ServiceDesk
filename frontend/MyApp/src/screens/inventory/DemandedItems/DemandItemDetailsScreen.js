// screens/DemandItemDetailsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Field, Button, Badge, Skeleton, EmptyState, useToast } from '../../../components/ui';

export default function DemandItemDetailsScreen({ route, navigation }) {
  const complaintId = route?.params?.complaint_id ?? route?.params?.complaintId;
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [details, setDetails] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchDetails = useCallback(async (isRefresh = false) => {
    if (!complaintId) { setLoading(false); return; }
    try {
      if (isRefresh) { setRefreshing(true); } else { setLoading(true); }

      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/demand_details/${complaintId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (!res.ok || json.success === false) { throw new Error(json.message || 'Failed to fetch demand details'); }
      setDetails(json.data || null);
    } catch (err) {
      console.log('Demand details fetch error:', err);
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId, toast]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const itemsArray = useMemo(() => Object.entries(details?.itemss || {}), [details]);

  const handleAccept = useCallback(async () => {
    if (!details?.complaint_id) { toast.error('Complaint ID not found'); return; }
    try {
      setAcceptLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/api/materialGiven/${details.complaint_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.success === false) { throw new Error(json.message || 'Failed to accept demand request'); }
      toast.success(json.message || 'Material given successfully');
      if (navigation?.goBack) { navigation.goBack(); }
    } catch (err) {
      console.log('Accept demand error:', err);
      toast.error(err?.message || 'Failed to accept demand request');
    } finally {
      setAcceptLoading(false);
    }
  }, [details, navigation, toast]);

  const handleReject = useCallback(() => {
    if (!details?.complaint_id || !details?.worker_id) { toast.error('Complaint ID / Worker ID missing'); return; }
    Alert.alert('Reject Demand', 'Are you sure you want to reject this demand request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setRejectLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/reject_demand_request`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ complaint_id: details.complaint_id, worker_id: details.worker_id }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || json.success === false) { throw new Error(json.message || 'Failed to reject demand request'); }
            toast.success(json.message || 'Demand request rejected successfully');
            if (navigation?.goBack) { navigation.goBack(); }
          } catch (err) {
            console.log('Reject demand error:', err);
            toast.error(err?.message || 'Failed to reject demand request');
          } finally {
            setRejectLoading(false);
          }
        },
      },
    ]);
  }, [details, navigation, toast]);

  const header = <AppBar title="Demand Details" subtitle="Inventory" role="inventory" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header} scroll>
        <Card>
          <Skeleton width={'40%'} height={20} />
          <Skeleton width={'70%'} height={14} style={{ marginTop: 14 }} />
        </Card>
      </Screen>
    );
  }

  if (!details) {
    return (
      <Screen header={header}>
        <EmptyState icon="list" title="No details found" />
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      scroll
      onRefresh={() => fetchDetails(true)}
      refreshing={refreshing}
      footer={
        <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Button title="Reject" variant="danger" icon="close" onPress={handleReject} loading={rejectLoading} disabled={acceptLoading} fullWidth={false} style={{ flex: 1 }} />
          <Button title="Accept" icon="check" onPress={handleAccept} loading={acceptLoading} disabled={rejectLoading} accent={colors.success} fullWidth={false} style={{ flex: 1 }} />
        </View>
      }
    >
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }}>BASIC INFO</Text>
      <Card style={{ marginBottom: 16 }}>
        <Field label="Complaint ID" value={details.complaint_id} />
        <Field label="Worker ID" value={details.worker_id} last />
      </Card>

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }}>ITEMS REQUESTED</Text>
      <Card>
        {itemsArray.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No items available.</Text>
        ) : (
          itemsArray.map(([key, qty], i) => (
            <View
              key={key}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: 12, borderBottomWidth: i === itemsArray.length - 1 ? 0 : 1, borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary, textTransform: 'capitalize' }}>{key}</Text>
              <Badge label={`Qty: ${qty}`} color={colors.primary} tint={colors.primaryTint} />
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
