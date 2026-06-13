// screens/worker/WorkerLoginScreen.js
import React, { useState } from 'react';
import { BASE_URL } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScaffold from '../../components/AuthScaffold';
import { Input, Button, useToast } from '../../components/ui';

export default function WorkerLoginScreen({ navigation }) {
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleLogin = async () => {
    const wid = workerId.trim();
    const pwd = password;

    if (!wid || !pwd) {
      toast.warning('Worker ID and password are required');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: wid,
          password: pwd,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ Save token + user info (keys unchanged)
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }
      await AsyncStorage.setItem('role', 'worker');
      await AsyncStorage.setItem('worker_id', String(wid));
      if (data.user) {
        await AsyncStorage.setItem('worker_user', JSON.stringify(data.user));
      }

      toast.success(data.message || 'Login successful');
      navigation.replace('WorkerComplaintsListScreen');
    } catch (err) {
      console.log('Worker login error:', err);
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      role="worker"
      title="Worker Login"
      caption="Sign in with your worker credentials"
      onBack={() => navigation.goBack()}
    >
      <Input
        label="Worker ID"
        leftIcon="user"
        placeholder="Enter worker id (e.g. 202)"
        value={workerId}
        onChangeText={setWorkerId}
        keyboardType="number-pad"
        editable={!loading}
      />
      <Input
        label="Password"
        leftIcon="lock"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <Button title="Login" iconRight="chevronRight" onPress={handleLogin} loading={loading} style={{ marginTop: 4 }} />
    </AuthScaffold>
  );
}
