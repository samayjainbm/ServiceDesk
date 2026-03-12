import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000'; // physical phone => laptop LAN IP

export default function PAWorkerCreateScreen({ navigation }) {
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
    try {
      const data = raw ? JSON.parse(raw) : {};
      return { raw, data, isJson: true };
    } catch {
      return { raw, data: null, isJson: false };
    }
  };

  const onCreate = async () => {
    const wid = String(worker_id).trim();
    const wname = String(worker_name).trim();
    const desg = String(designation).trim();
    const phone = String(phone_number).trim();
    const pwd = String(password).trim();

    // ---------- frontend validations ----------
    if (!wid || !wname || !desg || !phone) {
      Alert.alert('Warning', 'Sab worker fields bhar do.');
      return;
    }

    if (!/^\d+$/.test(wid)) {
      Alert.alert('Warning', 'Worker ID sirf numbers me hona chahiye.');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Warning', 'Phone number exactly 10 digits ka hona chahiye.');
      return;
    }

    if (createCredentialsToo && !pwd) {
      Alert.alert('Warning', 'Password do ya "NO" select karo credentials creation ke liye.');
      return;
    }

    if (createCredentialsToo && pwd.length < 4) {
      Alert.alert('Warning', 'Password kam se kam 4 characters ka rakho.');
      return;
    }

    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      // ---------- Step 1: Create worker ----------
      const workerRes = await fetch(`${BASE_URL}/api/pa/workers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          worker_id: wid,
          worker_name: wname,
          designation: desg,
          phone_number: phone,
        }),
      });

      const workerParsed = await parseResponseSafely(workerRes);

      if (!workerParsed.isJson) {
        Alert.alert(
          'Server Warning',
          `Worker API ne non-JSON response diya (HTTP ${workerRes.status}). Route/auth/backend error ho sakta hai.`
        );
        return;
      }

      if (!workerRes.ok) {
        const msg = workerParsed.data?.message || `Worker create failed (HTTP ${workerRes.status})`;

        if (workerRes.status === 409) {
          Alert.alert('Warning', 'Ye Worker ID pehle se exist karti hai. Dusri Worker ID try karo.');
          return;
        }

        if (workerRes.status === 401) {
          Alert.alert('Warning', 'Unauthorized. PA login dubara karo.');
          return;
        }

        if (workerRes.status === 403) {
          Alert.alert('Warning', 'Aapke token me PA permission nahi hai.');
          return;
        }

        Alert.alert('Warning', msg);
        return;
      }

      // ---------- If only worker creation ----------
      if (!createCredentialsToo) {
        Alert.alert('Success', 'Worker successfully create ho gaya.');
        navigation.navigate('PAWorkerListScreen');
        return;
      }

      // ---------- Step 2: Create credentials ----------
      const credRes = await fetch(`${BASE_URL}/api/pa/worker-credentials`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          worker_id: wid,
          password: pwd,
        }),
      });

      const credParsed = await parseResponseSafely(credRes);

      if (!credParsed.isJson) {
        Alert.alert(
          'Partial Success',
          `Worker create ho gaya, lekin credentials API ne non-JSON response diya (HTTP ${credRes.status}).`
        );
        navigation.navigate('PAWorkerListScreen');
        return;
      }

      if (!credRes.ok) {
        const msg = credParsed.data?.message || `Credentials create failed (HTTP ${credRes.status})`;

        if (credRes.status === 409) {
          Alert.alert(
            'Partial Success',
            'Worker create ho gaya, lekin credentials already exist karte hain is worker ke liye.'
          );
          navigation.navigate('PAWorkerListScreen');
          return;
        }

        if (credRes.status === 404) {
          Alert.alert(
            'Partial Success',
            'Worker create ho gaya, lekin credentials API ko worker nahi mila (backend mapping check karo).'
          );
          navigation.navigate('PAWorkerListScreen');
          return;
        }

        Alert.alert('Partial Success', `Worker create ho gaya, lekin credentials nahi bane: ${msg}`);
        navigation.navigate('PAWorkerListScreen');
        return;
      }

      // ---------- Full success ----------
      Alert.alert('Success', 'Worker aur credentials dono successfully create ho gaye.');
      navigation.navigate('PAWorkerListScreen');
    } catch (e) {
      console.log('Create worker/credentials error:', e);
      Alert.alert(
        'Warning',
        e?.message?.includes('Network request failed')
          ? 'Network error. Phone aur laptop same Wi-Fi pe hain ya nahi check karo.'
          : (e?.message || 'Request failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Worker</Text>

      <Text style={styles.label}>Worker ID</Text>
      <TextInput
        style={styles.input}
        value={worker_id}
        onChangeText={(t) => setWorkerId(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="1000"
        editable={!loading}
      />

      <Text style={styles.label}>Worker Name</Text>
      <TextInput
        style={styles.input}
        value={worker_name}
        onChangeText={setWorkerName}
        placeholder="Samay Jain"
        editable={!loading}
      />

      <Text style={styles.label}>Designation</Text>
      <TextInput
        style={styles.input}
        value={designation}
        onChangeText={setDesignation}
        placeholder="Helper"
        editable={!loading}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phone_number}
        onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="1234567890"
        maxLength={10}
        editable={!loading}
      />

      <Text style={styles.label}>Create Login Credentials Also?</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, createCredentialsToo ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={() => !loading && setCreateCredentialsToo(true)}
          disabled={loading}
        >
          <Text style={[styles.toggleText, createCredentialsToo ? styles.toggleTextActive : styles.toggleTextInactive]}>
            YES
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, !createCredentialsToo ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={() => !loading && setCreateCredentialsToo(false)}
          disabled={loading}
        >
          <Text style={[styles.toggleText, !createCredentialsToo ? styles.toggleTextActive : styles.toggleTextInactive]}>
            NO
          </Text>
        </TouchableOpacity>
      </View>

      {createCredentialsToo && (
        <>
          <Text style={styles.label}>Worker Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="worker@2"
            secureTextEntry
            editable={!loading}
          />
        </>
      )}

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={onCreate} disabled={loading}>
        <Text style={styles.btnText}>
          {loading
            ? (createCredentialsToo ? 'Creating Worker + Credentials...' : 'Creating Worker...')
            : (createCredentialsToo ? 'Create Worker + Credentials' : 'Create Worker')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#fff',
    paddingBottom: 30,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  label: {
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleBtnInactive: {
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
  },
  toggleText: {
    fontWeight: '800',
  },
  toggleTextActive: {
    color: '#fff',
  },
  toggleTextInactive: {
    color: '#111827',
  },

  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },

  btn: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});