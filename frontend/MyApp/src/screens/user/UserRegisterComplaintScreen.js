import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from '../../../config';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme';
import { Screen, AppBar, Card, Input, Button, useToast } from '../../components/ui';

export default function UserRegisterComplaintScreen({ navigation }) {
  const { colors, typography } = useTheme();
  const toast = useToast();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const authHeaders = async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const submit = async () => {
    const desc = description.trim();
    if (!desc) { return toast.warning('Please enter a description'); }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/complaint_krdi`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ description: desc }),
      });

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error(`Non-JSON response (HTTP ${res.status})`); }

      if (!res.ok || data?.success === false) { throw new Error(data?.message || `HTTP ${res.status}`); }

      toast.success(data?.message || 'Complaint created');
      navigation.navigate('UserComplaintsScreen');
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('not logged')) {
        toast.warning('Not logged in. Please login again.');
        navigation.reset({ index: 0, routes: [{ name: 'UserLoginScreen' }] });
        return;
      }
      toast.error(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      header={<AppBar title="Register Complaint" subtitle="MANIT ServiceDesk" role="user" onBack={() => navigation.goBack()} />}
      scroll
      keyboardAvoiding
    >
      <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: 14 }}>
        Describe the problem clearly so the team can route it to the right worker.
      </Text>

      <Card>
        <Input
          label="Description"
          placeholder="e.g. Tube light not working in Room 204, Hostel 5"
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!loading}
          autoCapitalize="sentences"
        />
      </Card>

      <Button title="Submit Complaint" icon="send" onPress={submit} loading={loading} style={{ marginTop: 18 }} />
    </Screen>
  );
}
