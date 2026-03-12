import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000';

export default function PAWorkerCredentialsScreen() {
  const [mode, setMode] = useState('create'); // create | update
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');

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
    try {
      return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true };
    } catch {
      return { data: null, raw, isJson: false };
    }
  };

  const showCreateMessage = (status, msg) => {
    if (status === 201 || status === 200) {
      Alert.alert('Done', 'Credentials created successfully.');
      return;
    }
    if (status === 409) {
      Alert.alert('Warning', msg || 'Credentials already exist for this worker.');
      return;
    }
    if (status === 404) {
      Alert.alert('Warning', msg || 'Worker not found. Pehle worker create karo.');
      return;
    }
    if (status === 400) {
      Alert.alert('Warning', msg || 'Invalid data. worker_id/password check karo.');
      return;
    }
    if (status === 401) {
      Alert.alert('Warning', 'Unauthorized. PA login dubara karo.');
      return;
    }
    if (status === 403) {
      Alert.alert('Warning', 'Aapko permission nahi hai ye action karne ki.');
      return;
    }
    Alert.alert('Error', msg || `Create failed (HTTP ${status})`);
  };

  const showUpdateMessage = (status, msg) => {
    if (status === 200) {
      Alert.alert('Done', 'Password updated successfully.');
      return;
    }
    if (status === 404) {
      Alert.alert('Warning', msg || 'Credentials/worker not found.');
      return;
    }
    if (status === 400) {
      Alert.alert('Warning', msg || 'Invalid password or request body.');
      return;
    }
    if (status === 401) {
      Alert.alert('Warning', 'Unauthorized. PA login dubara karo.');
      return;
    }
    if (status === 403) {
      Alert.alert('Warning', 'Aapko permission nahi hai ye action karne ki.');
      return;
    }
    Alert.alert('Error', msg || `Update failed (HTTP ${status})`);
  };

  const run = async () => {
    const wid = workerId.trim();
    const pwd = password.trim();

    if (!wid) {
      Alert.alert('Warning', 'Enter worker_id');
      return;
    }

    if (!/^\d+$/.test(wid)) {
      Alert.alert('Warning', 'worker_id must be numeric');
      return;
    }

    try {
      if (mode === 'create') {
        if (!pwd) return Alert.alert('Warning', 'Enter password');

        const res = await fetch(`${BASE_URL}/api/pa/worker-credentials`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ worker_id: wid, password: pwd }),
        });

        const parsed = await parseSafely(res);
        const msg = parsed.isJson ? parsed.data?.message : `Server returned non-JSON response (HTTP ${res.status})`;

        showCreateMessage(res.status, msg);
        return;
      }

      if (mode === 'update') {
        if (!pwd) return Alert.alert('Warning', 'Enter new password');

        const res = await fetch(`${BASE_URL}/api/pa/worker-credentials/${wid}`, {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify({ password: pwd }),
        });

        const parsed = await parseSafely(res);
        const msg = parsed.isJson ? parsed.data?.message : `Server returned non-JSON response (HTTP ${res.status})`;

        showUpdateMessage(res.status, msg);
        return;
      }
    } catch (e) {
      Alert.alert(
        'Error',
        e?.message?.includes('Network request failed')
          ? 'Network error. Phone aur laptop same Wi-Fi pe check karo.'
          : (e?.message || 'Request failed')
      );
    }
  };

  const Tab = ({ id, label }) => (
    <TouchableOpacity onPress={() => setMode(id)} style={[styles.tab, mode === id && styles.tabActive]}>
      <Text style={[styles.tabText, mode === id && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Credentials</Text>

      <View style={styles.tabs}>
        <Tab id="create" label="Create" />
        <Tab id="update" label="Update" />
      </View>

      <Text style={styles.label}>Worker ID</Text>
      <TextInput
        value={workerId}
        onChangeText={(t) => setWorkerId(t.replace(/[^0-9]/g, ''))}
        style={styles.input}
        keyboardType="number-pad"
        placeholder="1000"
      />

      <Text style={styles.label}>{mode === 'create' ? 'Password' : 'New Password'}</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="worker@2"
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          mode === 'update'
            ? styles.btnWarning
            : styles.btnPrimary,
        ]}
        onPress={run}
      >
        <Text style={styles.btnText}>
          {mode === 'create' && 'Create Credentials'}
          {mode === 'update' && 'Update Password'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 12 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  tab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb' },
  tabActive: { backgroundColor: '#111827', borderColor: '#111827' },
  tabText: { fontWeight: '800', color: '#111827' },
  tabTextActive: { color: '#fff' },
  label: { fontWeight: '800', marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },

  // Create (Blue)
  btnPrimary: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },

  // Update (Yellow)
  btnWarning: {
    backgroundColor: '#eab308',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },

  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});