import React, { useCallback, useEffect, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000';

export default function PAWorkerDetailScreen({ route, navigation }) {
  const workerId = route?.params?.workerId;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');

    const res = await fetch(`${BASE_URL}/api/pa/workers/${workerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json();
    if (!res.ok) {throw new Error(data?.message || `HTTP ${res.status}`);}

    const w = data?.data || data;
    setName(String(w?.name ?? w?.worker_name ?? ''));
    setPhoneNumber(String(w?.worker_phone_number ?? w?.phone_number ?? ''));
    setDesignation(String(w?.designation ?? ''));
  }, [workerId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e) {
        if (alive) {
          Alert.alert('Error', e?.message || 'Failed to load worker');
          navigation.goBack();
        }
      } finally {
        if (alive) {setLoading(false);}
      }
    })();
    return () => {
      alive = false;
    };
  }, [load, navigation]);

  const onUpdate = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('pa_token');

      const res = await fetch(`${BASE_URL}/api/pa/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, phone_number, designation }),
      });

      const data = await res.json();
      if (!res.ok) {throw new Error(data?.message || `HTTP ${res.status}`);}

      Alert.alert('Success', data?.message || 'Worker updated');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    Alert.alert('Confirm', `Delete worker ID ${workerId}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const token = await AsyncStorage.getItem('pa_token');

            const res = await fetch(`${BASE_URL}/api/pa/workers/${workerId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {throw new Error(data?.message || `HTTP ${res.status}`);}

            Alert.alert('Success', data?.message || 'Worker deleted');
            navigation.navigate('PAWorkerListScreen');
          } catch (e) {
            Alert.alert('Error', e?.message || 'Delete failed');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading worker...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker ID: {workerId}</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="name" />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput value={phone_number} onChangeText={setPhoneNumber} style={styles.input} keyboardType="phone-pad" placeholder="phone" />

      <Text style={styles.label}>Designation</Text>
      <TextInput value={designation} onChangeText={setDesignation} style={styles.input} placeholder="designation" />

      <TouchableOpacity style={styles.btn} onPress={onUpdate} disabled={saving}>
        <Text style={styles.btnText}>{saving ? 'Saving...' : 'Update Worker'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnDanger} onPress={onDelete} disabled={saving}>
        <Text style={styles.btnText}>{saving ? '...' : 'Delete Worker'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '900', marginBottom: 14 },
  label: { fontWeight: '800', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  btn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnDanger: { backgroundColor: '#b91c1c', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
