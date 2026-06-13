import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScaffold from '../../components/AuthScaffold';
import { Input, Button, useToast } from '../../components/ui';

export default function LoginScreen({ navigation }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const onSubmit = async () => {
    const invId = id.trim();
    const pwd = password;

    if (!invId || !pwd) {
      toast.warning('ID and password are required');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: invId,
          password: pwd,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'Invalid credentials');
      }

      await AsyncStorage.multiRemove([TOKEN_KEY, 'role', 'user_data', 'worker_user', 'pa_user']);

      if (data?.token) {
        await AsyncStorage.setItem(TOKEN_KEY, data.token);
      }
      await AsyncStorage.setItem('role', 'admin');

      toast.success(data?.message || 'Login successful');
      navigation.replace('InventoryMenuScreen');
    } catch (err) {
      console.log('Inventory login error:', err);
      toast.error(err?.message || 'Server not reachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold
      role="inventory"
      title="Inventory Login"
      caption="Sign in with your inventory credentials"
      onBack={() => navigation.goBack()}
    >
      <Input
        label="ID"
        leftIcon="user"
        placeholder="Enter inventory id"
        value={id}
        onChangeText={setId}
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
      <Button title="Login" iconRight="chevronRight" onPress={onSubmit} loading={loading} style={{ marginTop: 4 }} />
    </AuthScaffold>
  );
}
