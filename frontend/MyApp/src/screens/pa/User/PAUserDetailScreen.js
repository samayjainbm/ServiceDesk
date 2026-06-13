import React, { useEffect, useState, useCallback } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Input, Button, Skeleton, useToast } from '../../../components/ui';

export default function PAUserDetailScreen({ route, navigation }) {
  const initialUserId = route?.params?.userId ? String(route.params.userId) : '';
  const { colors } = useTheme();
  const toast = useToast();

  const [userId] = useState(initialUserId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }, []);

  const parseSafely = useCallback(async (res) => {
    const raw = await res.text();
    try { return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true }; }
    catch { return { data: null, raw, isJson: false }; }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!userId) { toast.error('User ID missing'); navigation.goBack(); return; }
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/pa/users/${userId}`, { method: 'GET', headers: await getAuthHeaders() });
      const parsed = await parseSafely(res);
      if (!parsed.isJson) { throw new Error(`Non-JSON response (HTTP ${res.status})`); }
      if (!res.ok) { throw new Error(parsed.data?.message || `HTTP ${res.status}`); }
      const u = parsed.data?.data || {};
      setUserName(String(u.user_name || ''));
      setUserAddress(String(u.user_address || ''));
      setPhoneNumber(String(u.phone_number || ''));
    } catch (e) {
      toast.error(e?.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId, navigation, getAuthHeaders, parseSafely, toast]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const onUpdate = async () => {
    const uname = userName.trim(); const uaddr = userAddress.trim(); const phone = phoneNumber.trim();
    if (!uname || !uaddr || !phone) { return toast.warning('Please fill all fields'); }
    if (!/^\d{10}$/.test(phone)) { return toast.warning('Phone number must be exactly 10 digits'); }
    try {
      setSaving(true);
      const res = await fetch(`${BASE_URL}/api/pa/users/${userId}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ user_name: uname, address: uaddr, phone_number: phone }),
      });
      const parsed = await parseSafely(res);
      const msg = parsed.isJson ? parsed.data?.message : `Non-JSON response (HTTP ${res.status})`;
      if (res.status === 200) { return toast.success(msg || 'User updated successfully'); }
      if (res.status === 400) { return toast.warning(msg || 'Invalid data'); }
      if (res.status === 404) { return toast.warning(msg || 'User not found'); }
      if (res.status === 401) { return toast.error('Unauthorized. Please log in as PA again.'); }
      if (res.status === 403) { return toast.error('You do not have permission for this action.'); }
      toast.error(msg || `Update failed (HTTP ${res.status})`);
    } catch (e) {
      toast.error(e?.message?.includes('Network request failed') ? 'Network error. Check your connection.' : (e?.message || 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete User', `Delete user ${userId}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/pa/users/${userId}`, { method: 'DELETE', headers: await getAuthHeaders() });
            const parsed = await parseSafely(res);
            const msg = parsed.isJson ? parsed.data?.message : `Non-JSON response (HTTP ${res.status})`;
            if (res.status === 200) { toast.success(msg || 'User deleted successfully'); navigation.navigate('PAUserListScreen'); return; }
            if (res.status === 404) { return toast.warning(msg || 'User not found'); }
            if (res.status === 401) { return toast.error('Unauthorized. Please log in as PA again.'); }
            if (res.status === 403) { return toast.error('You do not have permission for this action.'); }
            toast.error(msg || `Delete failed (HTTP ${res.status})`);
          } catch (e) {
            toast.error(e?.message?.includes('Network request failed') ? 'Network error. Check your connection.' : (e?.message || 'Delete failed'));
          }
        },
      },
    ]);
  };

  const header = <AppBar title="User Detail" subtitle={`User #${userId}`} role="pa" onBack={() => navigation.goBack()} />;

  if (loading) {
    return (
      <Screen header={header} scroll>
        <Card>
          <Skeleton width={'40%'} height={16} />
          <Skeleton width={'100%'} height={48} radius={12} style={{ marginTop: 14 }} />
          <Skeleton width={'100%'} height={48} radius={12} style={{ marginTop: 12 }} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen header={header} scroll keyboardAvoiding>
      <Card style={{ marginBottom: 16 }} accentBar={colors.primary}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>USER ID</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 2 }}>#{userId}</Text>
      </Card>

      <Card>
        <Input label="User Name" leftIcon="user" value={userName} onChangeText={setUserName} placeholder="User name" autoCapitalize="words" />
        <Input label="User Address" value={userAddress} onChangeText={setUserAddress} placeholder="Address" multiline autoCapitalize="sentences" />
        <Input label="Phone Number" leftIcon="mail" value={phoneNumber} onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={10} placeholder="Phone" />
      </Card>

      <Button title="Update User" icon="check" onPress={onUpdate} loading={saving} style={{ marginTop: 18 }} />
      <Button title="Change Password" variant="secondary" icon="lock" onPress={() => navigation.navigate('PAUserPasswordScreen', { userId })} style={{ marginTop: 10 }} />
      <Button title="Delete User" variant="danger" icon="close" onPress={onDelete} disabled={saving} style={{ marginTop: 10 }} />
    </Screen>
  );
}
