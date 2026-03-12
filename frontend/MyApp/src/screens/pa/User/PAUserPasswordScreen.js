import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000';

export default function PAUserPasswordScreen({ route, navigation }) {
  const userId = route?.params?.userId ? String(route.params.userId) : '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const parseSafely = async (res) => {
    const raw = await res.text();
    try {
      return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true };
    } catch {
      return { data: null, raw, isJson: false };
    }
  };

  const onUpdatePassword = async () => {
    const pwd = password.trim();

    if (!userId) {
      Alert.alert('Error', 'User ID missing');
      return;
    }

    if (!pwd) {
      Alert.alert('Warning', 'Enter new password');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/pa/users/${userId}/password`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ password: pwd }),
      });

      const parsed = await parseSafely(res);
      const msg = parsed.isJson ? parsed.data?.message : `Server returned non-JSON response (HTTP ${res.status})`;

      if (res.status === 200) {
        Alert.alert('Done', msg || 'Password updated successfully');
        navigation.goBack();
        return;
      }

      if (res.status === 400) return Alert.alert('Warning', msg || 'Invalid request body');
      if (res.status === 404) return Alert.alert('Warning', msg || 'User not found');
      if (res.status === 401) return Alert.alert('Warning', 'Unauthorized. PA login dubara karo.');
      if (res.status === 403) return Alert.alert('Warning', 'Aapko permission nahi hai ye action karne ki.');

      Alert.alert('Error', msg || `Password update failed (HTTP ${res.status})`);
    } catch (e) {
      Alert.alert(
        'Error',
        e?.message?.includes('Network request failed')
          ? 'Network error. Phone aur laptop same Wi-Fi pe check karo.'
          : (e?.message || 'Password update failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change User Password</Text>

      <View style={styles.idBox}>
        <Text style={styles.idLabel}>User ID</Text>
        <Text style={styles.idValue}>{userId}</Text>
      </View>

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter new password"
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={onUpdatePassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#111827" /> : <Text style={styles.btnText}>Update Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 18 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 12, color: '#111827' },

  idBox: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  idLabel: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  idValue: { color: '#1e3a8a', fontWeight: '900', fontSize: 18, marginTop: 2 },

  label: { fontWeight: '800', marginBottom: 6, color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },

  btn: {
    backgroundColor: '#eab308', // yellow
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#111827', fontSize: 16, fontWeight: '900' },
});