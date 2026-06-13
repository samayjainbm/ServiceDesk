import React, { useState } from 'react';
import { BASE_URL } from '../../../../config';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../theme';
import { Screen, AppBar, Card, Input, Button, SegmentedControl, useToast } from '../../../components/ui';

export default function PAWorkerCreateScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [worker_id, setWorkerId] = useState('');
  const [worker_name, setWorkerName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [createCredentialsToo, setCreateCredentialsToo] = useState(true);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const parseResponseSafely = async (res) => {
    const raw = await res.text();
    try { return { raw, data: raw ? JSON.parse(raw) : {}, isJson: true }; }
    catch { return { raw, data: null, isJson: false }; }
  };

  const onCreate = async () => {
    const wid = String(worker_id).trim();
    const wname = String(worker_name).trim();
    const desg = String(designation).trim();
    const phone = String(phone_number).trim();
    const pwd = String(password).trim();

    if (!wid || !wname || !desg || !phone) { return toast.warning('Please fill all worker fields.'); }
    if (!/^\d+$/.test(wid)) { return toast.warning('Worker ID must be numeric.'); }
    if (!/^\d{10}$/.test(phone)) { return toast.warning('Phone number must be exactly 10 digits.'); }
    if (createCredentialsToo && !pwd) { return toast.warning('Enter a password or select "No" for credentials.'); }
    if (createCredentialsToo && pwd.length < 4) { return toast.warning('Password must be at least 4 characters.'); }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const workerRes = await fetch(`${BASE_URL}/api/pa/workers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ worker_id: wid, worker_name: wname, designation: desg, phone_number: phone }),
      });
      const workerParsed = await parseResponseSafely(workerRes);

      if (!workerParsed.isJson) { return toast.error(`Worker API returned a non-JSON response (HTTP ${workerRes.status}).`); }
      if (!workerRes.ok) {
        if (workerRes.status === 409) { return toast.error('This Worker ID already exists. Try another.'); }
        if (workerRes.status === 401) { return toast.error('Unauthorized. Please log in as PA again.'); }
        if (workerRes.status === 403) { return toast.error('Your token does not have PA permission.'); }
        return toast.error(workerParsed.data?.message || `Worker create failed (HTTP ${workerRes.status})`);
      }

      if (!createCredentialsToo) {
        toast.success('Worker created successfully.');
        navigation.navigate('PAWorkerListScreen');
        return;
      }

      const credRes = await fetch(`${BASE_URL}/api/pa/worker-credentials`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ worker_id: wid, password: pwd }),
      });
      const credParsed = await parseResponseSafely(credRes);

      if (!credParsed.isJson) {
        toast.warning(`Worker created, but credentials API returned non-JSON (HTTP ${credRes.status}).`);
        navigation.navigate('PAWorkerListScreen');
        return;
      }
      if (!credRes.ok) {
        if (credRes.status === 409) { toast.warning('Worker created, but credentials already exist.'); }
        else if (credRes.status === 404) { toast.warning('Worker created, but credentials API could not find the worker.'); }
        else { toast.warning(`Worker created, but credentials failed: ${credParsed.data?.message || `HTTP ${credRes.status}`}`); }
        navigation.navigate('PAWorkerListScreen');
        return;
      }

      toast.success('Worker and credentials created successfully.');
      navigation.navigate('PAWorkerListScreen');
    } catch (e) {
      console.log('Create worker/credentials error:', e);
      toast.error(e?.message?.includes('Network request failed') ? 'Network error. Check your connection.' : (e?.message || 'Request failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      header={<AppBar title="Create Worker" subtitle="Administration" role="pa" onBack={() => navigation.goBack()} />}
      scroll
      keyboardAvoiding
    >
      <Card>
        <Input label="Worker ID" leftIcon="user" placeholder="1000" value={worker_id} onChangeText={(t) => setWorkerId(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" editable={!loading} />
        <Input label="Worker Name" placeholder="Full name" value={worker_name} onChangeText={setWorkerName} autoCapitalize="words" editable={!loading} />
        <Input label="Designation" placeholder="e.g. Helper, Electrician" value={designation} onChangeText={setDesignation} autoCapitalize="words" editable={!loading} />
        <Input label="Phone Number" leftIcon="mail" placeholder="10-digit number" value={phone_number} onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={10} editable={!loading} />

        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.3, marginBottom: 8, marginTop: 4 }}>CREATE LOGIN CREDENTIALS?</Text>
        <SegmentedControl
          options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]}
          value={createCredentialsToo}
          onChange={(v) => !loading && setCreateCredentialsToo(v)}
        />

        {createCredentialsToo && (
          <View style={{ marginTop: 14 }}>
            <Input label="Worker Password" leftIcon="lock" placeholder="At least 4 characters" value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />
          </View>
        )}
      </Card>

      <Button
        title={createCredentialsToo ? 'Create Worker + Credentials' : 'Create Worker'}
        icon="plus"
        onPress={onCreate}
        loading={loading}
        style={{ marginTop: 18 }}
      />
    </Screen>
  );
}
