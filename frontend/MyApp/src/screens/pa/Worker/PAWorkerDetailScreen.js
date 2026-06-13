import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL } from '../../../../config';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, AppBar, Card, Input, Button, Skeleton, useToast } from '../../../components/ui';

export default function PAWorkerDetailScreen({ route, navigation }) {
  const workerId = route?.params?.workerId;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');
    const res = await fetch(`${BASE_URL}/api/pa/workers/${workerId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const data = await res.json();
    if (!res.ok) { throw new Error(data?.message || `HTTP ${res.status}`); }
    const w = data?.data || data;
    setName(String(w?.name ?? w?.worker_name ?? ''));
    setPhoneNumber(String(w?.worker_phone_number ?? w?.phone_number ?? ''));
    setDesignation(String(w?.designation ?? ''));
  }, [workerId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { setLoading(true); await load(); }
      catch (e) { if (alive) { toast.error(e?.message || 'Failed to load worker'); navigation.goBack(); } }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [load, navigation, toast]);

  const onUpdate = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('pa_token');
      const res = await fetch(`${BASE_URL}/api/pa/workers/${workerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name, phone_number, designation }),
      });
      const data = await res.json();
      if (!res.ok) { throw new Error(data?.message || `HTTP ${res.status}`); }
      toast.success(data?.message || 'Worker updated');
    } catch (e) {
      toast.error(e?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete Worker', `Delete worker ID ${workerId}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const token = await AsyncStorage.getItem('pa_token');
            const res = await fetch(`${BASE_URL}/api/pa/workers/${workerId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { throw new Error(data?.message || `HTTP ${res.status}`); }
            toast.success(data?.message || 'Worker deleted');
            navigation.navigate('PAWorkerListScreen');
          } catch (e) {
            toast.error(e?.message || 'Delete failed');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const header = <AppBar title="Worker Detail" subtitle={`Worker #${workerId}`} role="pa" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header} scroll>
        <Card>
          <Skeleton width={'50%'} height={16} />
          <Skeleton width={'100%'} height={48} radius={12} style={{ marginTop: 14 }} />
          <Skeleton width={'100%'} height={48} radius={12} style={{ marginTop: 12 }} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen header={header} scroll keyboardAvoiding>
      <Card>
        <Input label="Name" leftIcon="user" value={name} onChangeText={setName} placeholder="Worker name" autoCapitalize="words" />
        <Input label="Phone Number" leftIcon="mail" value={phone_number} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="Phone" />
        <Input label="Designation" value={designation} onChangeText={setDesignation} placeholder="Designation" autoCapitalize="words" />
      </Card>

      <Button title="Update Worker" icon="check" onPress={onUpdate} loading={saving} style={{ marginTop: 18 }} />
      <Button title="Delete Worker" variant="danger" icon="close" onPress={onDelete} disabled={saving} style={{ marginTop: 10 }} />
    </Screen>
  );
}
