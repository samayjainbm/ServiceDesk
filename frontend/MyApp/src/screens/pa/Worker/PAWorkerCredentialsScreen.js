import React, { useState } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Input, Button, SegmentedControl, useToast } from '../../../components/ui';

export default function PAWorkerCredentialsScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [mode, setMode] = useState('create'); // create | update
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeaders = async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const parseSafely = async (res) => {
    const raw = await res.text();
    try { return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true }; }
    catch { return { data: null, raw, isJson: false }; }
  };

  const reportCreate = (status, msg) => {
    if (status === 201 || status === 200) return toast.success('Credentials created successfully.');
    if (status === 409) return toast.warning(msg || 'Credentials already exist for this worker.');
    if (status === 404) return toast.warning(msg || 'Worker not found. Create the worker first.');
    if (status === 400) return toast.warning(msg || 'Invalid data. Check worker ID / password.');
    if (status === 401) return toast.error('Unauthorized. Please log in as PA again.');
    if (status === 403) return toast.error('You do not have permission for this action.');
    return toast.error(msg || `Create failed (HTTP ${status})`);
  };

  const reportUpdate = (status, msg) => {
    if (status === 200) return toast.success('Password updated successfully.');
    if (status === 404) return toast.warning(msg || 'Credentials / worker not found.');
    if (status === 400) return toast.warning(msg || 'Invalid password or request body.');
    if (status === 401) return toast.error('Unauthorized. Please log in as PA again.');
    if (status === 403) return toast.error('You do not have permission for this action.');
    return toast.error(msg || `Update failed (HTTP ${status})`);
  };

  const run = async () => {
    const wid = workerId.trim();
    const pwd = password.trim();
    if (!wid) { return toast.warning('Enter worker ID'); }
    if (!/^\d+$/.test(wid)) { return toast.warning('Worker ID must be numeric'); }
    if (!pwd) { return toast.warning(mode === 'create' ? 'Enter password' : 'Enter new password'); }

    try {
      setLoading(true);
      if (mode === 'create') {
        const res = await fetch(`${BASE_URL}/api/pa/worker-credentials`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ worker_id: wid, password: pwd }),
        });
        const parsed = await parseSafely(res);
        reportCreate(res.status, parsed.isJson ? parsed.data?.message : `Non-JSON response (HTTP ${res.status})`);
      } else {
        const res = await fetch(`${BASE_URL}/api/pa/worker-credentials/${wid}`, {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify({ password: pwd }),
        });
        const parsed = await parseSafely(res);
        reportUpdate(res.status, parsed.isJson ? parsed.data?.message : `Non-JSON response (HTTP ${res.status})`);
      }
    } catch (e) {
      toast.error(e?.message?.includes('Network request failed') ? 'Network error. Check your connection.' : (e?.message || 'Request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header={<AppBar title="Worker Credentials" subtitle="Administration" role="pa" onBack={() => navigation.goBack()} />} scroll keyboardAvoiding>
      <SegmentedControl
        options={[{ value: 'create', label: 'Create' }, { value: 'update', label: 'Update' }]}
        value={mode}
        onChange={setMode}
      />
      <View style={{ height: 16 }} />
      <Card>
        <Input label="Worker ID" leftIcon="user" value={workerId} onChangeText={(t) => setWorkerId(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" placeholder="1000" editable={!loading} />
        <Input label={mode === 'create' ? 'Password' : 'New Password'} leftIcon="lock" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry editable={!loading} />
        <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>
          {mode === 'create' ? 'Creates login credentials for an existing worker.' : 'Updates the password for an existing worker.'}
        </Text>
      </Card>

      <Button
        title={mode === 'create' ? 'Create Credentials' : 'Update Password'}
        icon={mode === 'create' ? 'plus' : 'refresh'}
        onPress={run}
        loading={loading}
        accent={mode === 'update' ? colors.accent : undefined}
        style={{ marginTop: 18 }}
      />
    </Screen>
  );
}
