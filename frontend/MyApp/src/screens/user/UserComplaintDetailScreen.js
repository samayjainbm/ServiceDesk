// src/screens/user/UserComplaintDetailScreen.js
import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from '../../../config';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Field, Button, StatusPill, Skeleton, EmptyState, useToast } from '../../components/ui';

export default function UserComplaintDetailScreen({ route, navigation }) {
  const complaintId = route?.params?.complaintId ? String(route.params.complaintId) : '';
  const { colors } = useTheme();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [c, setC] = useState(null);

  const authHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!complaintId) return;

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/show_complaint_detail/${complaintId}`, {
        method: 'GET',
        headers: await authHeaders(),
      });

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error(`Non-JSON response (HTTP ${res.status})`); }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      setC(data?.complaint || null);
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.toLowerCase().includes('not logged')) {
        toast.warning('Not logged in. Please login again.');
        navigation.reset({ index: 0, routes: [{ name: 'UserLoginScreen' }] });
        return;
      }
      toast.error(msg || 'Failed to fetch detail');
    } finally {
      setLoading(false);
    }
  }, [complaintId, authHeaders, navigation, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const goToResolveItems = () => {
    if (!complaintId) return;
    navigation.navigate('UserResolveItemsScreen', { complaintId });
  };

  const header = <AppBar title="Complaint Details" subtitle="MANIT ServiceDesk" role="user" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header} scroll>
        <Card>
          <Skeleton width={'40%'} height={20} />
          <Skeleton width={'60%'} height={14} style={{ marginTop: 14 }} />
          <Skeleton width={'90%'} height={14} style={{ marginTop: 10 }} />
          <Skeleton width={'80%'} height={14} style={{ marginTop: 10 }} />
        </Card>
      </Screen>
    );
  }

  if (!c) {
    return (
      <Screen header={header}>
        <EmptyState icon="clipboard" title="No detail found" subtitle="We couldn't load this complaint." />
      </Screen>
    );
  }

  return (
    <Screen header={header} scroll>
      {/* Status header */}
      <Card style={{ marginBottom: 16 }} accentBar={colors.primary}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>COMPLAINT</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 2 }}>
              #{c.complaint_id}
            </Text>
          </View>
          <StatusPill status={c.status} />
        </View>
      </Card>

      <Card>
        <Field label="Worker ID" value={c.worker_id ?? 'Not assigned'} />
        <Field label="Phone" value={c.phone_number} />
        <Field label="Address" value={c.address} />
        <Field label="Description" value={c.description} last />
      </Card>

      <Button title="Resolve Complaint" icon="checkCircle" onPress={goToResolveItems} style={{ marginTop: 18 }} />
    </Screen>
  );
}
