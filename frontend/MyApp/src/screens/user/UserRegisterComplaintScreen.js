import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000';
// const TOKEN_KEY = 'token'; // ✅ ONLY ONE TOKEN NAME

export default function UserRegisterComplaintScreen({ navigation }) {
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
    if (!desc) {return Alert.alert('Warning', 'Enter description');}

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

      if (!res.ok || data?.success === false) {throw new Error(data?.message || `HTTP ${res.status}`);}

      Alert.alert('Done', data?.message || 'Complaint created');
      navigation.navigate('UserComplaintsScreen');
    } catch (e) {
      if (String(e?.message || '').toLowerCase().includes('not logged')) {
        Alert.alert('Warning', 'Not logged in. Please login again.');
        navigation.reset({ index: 0, routes: [{ name: 'UserLoginScreen' }] });
        return;
      }
      Alert.alert('Error', e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Complaint</Text>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Bulb phoot gaya..."
        multiline
        editable={!loading}
      />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 18 },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 12 },
  label: { fontWeight: '800', color: '#111827', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#fff' },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  btn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
