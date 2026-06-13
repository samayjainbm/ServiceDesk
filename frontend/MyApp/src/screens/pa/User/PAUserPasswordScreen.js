import React, { useState } from 'react';
import { BASE_URL } from '../../../../config';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Input, Button, useToast } from '../../../components/ui';

export default function PAUserPasswordScreen({ route, navigation }) {
  const userId = route?.params?.userId ? String(route.params.userId) : '';
  const { colors } = useTheme();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const parseSafely = async (res) => {
    const raw = await res.text();
    try { return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true }; }
    catch { return { data: null, raw, isJson: false }; }
  };

  const onUpdatePassword = async () => {
    const pwd = password.trim();
    if (!userId) { return toast.error('User ID missing'); }
    if (!pwd) { return toast.warning('Enter new password'); }

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/pa/users/${userId}/password`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ password: pwd }),
      });
      const parsed = await parseSafely(res);
      const msg = parsed.isJson ? parsed.data?.message : `Non-JSON response (HTTP ${res.status})`;
      if (res.status === 200) { toast.success(msg || 'Password updated successfully'); navigation.goBack(); return; }
      if (res.status === 400) { return toast.warning(msg || 'Invalid request body'); }
      if (res.status === 404) { return toast.warning(msg || 'User not found'); }
      if (res.status === 401) { return toast.error('Unauthorized. Please log in as PA again.'); }
      if (res.status === 403) { return toast.error('You do not have permission for this action.'); }
      toast.error(msg || `Password update failed (HTTP ${res.status})`);
    } catch (e) {
      toast.error(e?.message?.includes('Network request failed') ? 'Network error. Check your connection.' : (e?.message || 'Password update failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header={<AppBar title="Change Password" subtitle={`User #${userId}`} role="pa" onBack={() => navigation.goBack()} />} scroll keyboardAvoiding>
      <Card style={{ marginBottom: 16 }} accentBar={colors.primary}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>USER ID</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 2 }}>#{userId}</Text>
      </Card>

      <Card>
        <Input label="New Password" leftIcon="lock" value={password} onChangeText={setPassword} placeholder="Enter new password" secureTextEntry editable={!loading} />
      </Card>

      <Button title="Update Password" icon="check" onPress={onUpdatePassword} loading={loading} accent={colors.accent} style={{ marginTop: 18 }} />
    </Screen>
  );
}
