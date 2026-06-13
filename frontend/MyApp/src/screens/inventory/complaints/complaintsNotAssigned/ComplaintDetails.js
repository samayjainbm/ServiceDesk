// ComplaintDetailsScreen.js (with Assign Worker button)
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../../../../config';
import { View, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../../theme';
import { Screen, AppBar, Card, Field, Button, StatusPill, Skeleton, EmptyState, useToast } from '../../../../components/ui';

export default function ComplaintDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { complaint_id } = route.params || {};
  const { colors, getRoleAccent } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!complaint_id) {
          toast.error('complaint_id missing');
          setLoading(false);
          return;
        }
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          toast.warning('Token missing. Please login again.');
          setLoading(false);
          return;
        }

        const res = await fetch(`${BASE_URL}/api/booked_details/${complaint_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (!res.ok || json?.success === false) {
          toast.error(json?.message || 'Failed to load complaint details');
          setLoading(false);
          return;
        }
        setComplaint(json.data || null);
        setUserName(json.user_details?.user_name || '');
      } catch (e) {
        console.log('ComplaintDetails error:', e);
        toast.error('Backend not reachable');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [complaint_id, toast]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toDateString();
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

  if (!complaint) {
    return (
      <Screen header={header}>
        <EmptyState icon="clipboard" title="No details found" subtitle={`No data for complaint #${complaint_id}`} />
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      scroll
      footer={
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface }}>
          <Button title="Assign Worker" icon="users" onPress={() => navigation.navigate('AssignWorker', { complaint_id: complaint.complaint_id })} />
        </View>
      }
    >
      <Card style={{ marginBottom: 16 }} accentBar={getRoleAccent('inventory').color}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>COMPLAINT</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 2 }}>#{complaint.complaint_id}</Text>
          </View>
          <StatusPill status={complaint.status} />
        </View>
      </Card>

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }}>USER</Text>
      <Card style={{ marginBottom: 16 }}>
        <Field label="User Name" value={userName} />
        <Field label="User ID" value={complaint.user_id} />
        <Field label="Phone" value={complaint.phone_number} last />
      </Card>

      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }}>COMPLAINT INFO</Text>
      <Card>
        <Field label="Start Date" value={formatDate(complaint.start_date)} />
        <Field label="Address" value={complaint.address} />
        <Field label="Description" value={complaint.description} last />
      </Card>
    </Screen>
  );
}
