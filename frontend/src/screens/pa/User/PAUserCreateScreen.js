import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../../config";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'http://192.168.0.111:3000';

export default function PAUserCreateScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const showCreateMessage = (status, msg) => {
    if (status === 201 || status === 200) {
      Alert.alert('Done', 'User created successfully.');
      return true;
    }
    if (status === 409) {
      Alert.alert('Warning', msg || 'User already exists.');
      return false;
    }
    if (status === 400) {
      Alert.alert('Warning', msg || 'Invalid data. Fields check karo.');
      return false;
    }
    if (status === 401) {
      Alert.alert('Warning', 'Unauthorized. PA login dubara karo.');
      return false;
    }
    if (status === 403) {
      Alert.alert('Warning', 'Aapko permission nahi hai ye action karne ki.');
      return false;
    }
    Alert.alert('Error', msg || `User create failed (HTTP ${status})`);
    return false;
  };

  const onCreate = async () => {
    const uid = userId.trim();
    const uname = userName.trim();
    const uaddr = userAddress.trim();
    const phone = phoneNumber.trim();
    const pwd = password.trim();

    if (!uid || !uname || !uaddr || !phone || !pwd) {
      Alert.alert('Warning', 'Fill all fields');
      return;
    }

    if (!/^\d+$/.test(uid)) {
      Alert.alert('Warning', 'User ID must be numeric');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Warning', 'Phone number must be exactly 10 digits');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/pa/users`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          user_id: Number(uid),
          user_name: uname,
          user_address: uaddr,
          phone_number: phone,
          password: pwd,
        }),
      });

      const parsed = await parseSafely(res);
      const msg = parsed.isJson ? parsed.data?.message : `Server returned non-JSON response (HTTP ${res.status})`;

      const ok = showCreateMessage(res.status, msg);
      if (!ok) return;

      navigation.replace('PAUserDetailScreen', { userId: uid });
    } catch (e) {
      Alert.alert(
        'Error',
        e?.message?.includes('Network request failed')
          ? 'Network error. Phone aur laptop same Wi-Fi pe check karo.'
          : (e?.message || 'Failed to create user')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create User</Text>

      <Text style={styles.label}>User ID</Text>
      <TextInput
        style={styles.input}
        value={userId}
        onChangeText={(t) => setUserId(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="1001"
        editable={!loading}
      />

      <Text style={styles.label}>User Name</Text>
      <TextInput
        style={styles.input}
        value={userName}
        onChangeText={setUserName}
        placeholder="Samay/Priyansh"
        editable={!loading}
      />

      <Text style={styles.label}>User Address</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={userAddress}
        onChangeText={setUserAddress}
        placeholder="Hostel / Room / Address"
        multiline
        editable={!loading}
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        placeholder="1234554321"
        maxLength={10}
        editable={!loading}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="user@123"
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={onCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create User</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: '#fff', paddingBottom: 30 },
  title: { fontSize: 22, fontWeight: '900', marginBottom: 12, color: '#111827' },
  label: { fontWeight: '800', marginTop: 10, marginBottom: 6, color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },

  btnPrimary: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});