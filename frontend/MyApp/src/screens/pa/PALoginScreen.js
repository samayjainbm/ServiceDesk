// src/screens/pa/PALoginScreen.js
import React, { useState } from 'react';
import { BASE_URL } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScaffold from '../../components/AuthScaffold';
import { Input, Button, useToast } from '../../components/ui';

export default function PALoginScreen({ navigation }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handlePALogin = async () => {
    const lid = loginId.trim();
    const pwd = password;

    if (!lid || !pwd) { return toast.warning('Login ID and password are required'); }
    if (!/^\d+$/.test(lid)) { return toast.warning('Login ID must be numeric'); }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_pa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: lid, password: pwd }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) { throw new Error(data?.message || 'PA login failed'); }
      if (!data?.token) { throw new Error('Token not received from backend'); }

      // ✅ CLEAR everything old + save ONLY pa_token (keys unchanged)
      await AsyncStorage.multiRemove(['pa_token', 'role', 'user_data', 'worker_user', 'pa_user', 'token']);
      await AsyncStorage.setItem('pa_token', data.token);
      await AsyncStorage.setItem('role', 'pa');
      await AsyncStorage.setItem(
        'pa_user',
        JSON.stringify({
          role: data?.role || 'pa',
          login_id: lid,
        })
      );

      navigation.reset({ index: 0, routes: [{ name: 'PAHomeScreen' }] });
    } catch (err) {
      console.log('PA login error:', err);
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      role="pa"
      title="PA Login"
      caption="Sign in with your administrator credentials"
      onBack={() => navigation.goBack()}
    >
      <Input
        label="Login ID"
        leftIcon="user"
        placeholder="Enter PA login id"
        value={loginId}
        onChangeText={(text) => setLoginId(text.replace(/[^0-9]/g, ''))}
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
      <Button title="Login" iconRight="chevronRight" onPress={handlePALogin} loading={loading} style={{ marginTop: 4 }} />
    </AuthScaffold>
  );
}
