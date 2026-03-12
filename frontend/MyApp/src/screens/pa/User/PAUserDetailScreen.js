import React, { useEffect, useState, useCallback } from 'react';
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

export default function PAUserDetailScreen({ route, navigation }) {
  const initialUserId = route?.params?.userId ? String(route.params.userId) : '';

  const [userId] = useState(initialUserId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userName, setUserName] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const getAuthHeaders = useCallback(async () => {
    const token = await AsyncStorage.getItem('pa_token');
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const parseSafely = useCallback(async (res) => {
    const raw = await res.text();
    try {
      return { data: raw ? JSON.parse(raw) : {}, raw, isJson: true };
    } catch {
      return { data: null, raw, isJson: false };
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID missing');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/pa/users/${userId}`, {
        method: 'GET',
        headers: await getAuthHeaders(),
      });

      const parsed = await parseSafely(res);

      if (!parsed.isJson) {
        throw new Error(`Server returned non-JSON response (HTTP ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(parsed.data?.message || `HTTP ${res.status}`);
      }

      const u = parsed.data?.data || {};
      setUserName(String(u.user_name || ''));
      setUserAddress(String(u.user_address || ''));
      setPhoneNumber(String(u.phone_number || ''));
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId, navigation, getAuthHeaders, parseSafely]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const onUpdate = async () => {
    const uname = userName.trim();
    const uaddr = userAddress.trim();
    const phone = phoneNumber.trim();

    if (!uname || !uaddr || !phone) {
      Alert.alert('Warning', 'Fill all fields');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      Alert.alert('Warning', 'Phone number must be exactly 10 digits');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(`${BASE_URL}/api/pa/users/${userId}`, {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          user_name: uname,
          address: uaddr, // ✅ as per your Postman screenshot
          phone_number: phone,
        }),
      });

      const parsed = await parseSafely(res);
      const msg = parsed.isJson ? parsed.data?.message : `Server returned non-JSON response (HTTP ${res.status})`;

      if (res.status === 200) {
        Alert.alert('Done', msg || 'User updated successfully');
        return;
      }

      if (res.status === 400) return Alert.alert('Warning', msg || 'Invalid data');
      if (res.status === 404) return Alert.alert('Warning', msg || 'User not found');
      if (res.status === 401) return Alert.alert('Warning', 'Unauthorized. PA login dubara karo.');
      if (res.status === 403) return Alert.alert('Warning', 'Aapko permission nahi hai ye action karne ki.');

      Alert.alert('Error', msg || `Update failed (HTTP ${res.status})`);
    } catch (e) {
      Alert.alert(
        'Error',
        e?.message?.includes('Network request failed')
          ? 'Network error. Phone aur laptop same Wi-Fi pe check karo.'
          : (e?.message || 'Update failed')
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Confirm Delete', `Delete user ${userId}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${BASE_URL}/api/pa/users/${userId}`, {
              method: 'DELETE',
              headers: await getAuthHeaders(),
            });

            const parsed = await parseSafely(res);
            const msg = parsed.isJson ? parsed.data?.message : `Server returned non-JSON response (HTTP ${res.status})`;

            if (res.status === 200) {
              Alert.alert('Done', msg || 'User deleted successfully');
              navigation.navigate('PAUserListScreen');
              return;
            }

            if (res.status === 404) return Alert.alert('Warning', msg || 'User not found');
            if (res.status === 401) return Alert.alert('Warning', 'Unauthorized. PA login dubara karo.');
            if (res.status === 403) return Alert.alert('Warning', 'Aapko permission nahi hai ye action karne ki.');

            Alert.alert('Error', msg || `Delete failed (HTTP ${res.status})`);
          } catch (e) {
            Alert.alert(
              'Error',
              e?.message?.includes('Network request failed')
                ? 'Network error. Phone aur laptop same Wi-Fi pe check karo.'
                : (e?.message || 'Delete failed')
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading user...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>User Detail</Text>

      <View style={styles.idBox}>
        <Text style={styles.idLabel}>User ID</Text>
        <Text style={styles.idValue}>{userId}</Text>
      </View>

      <Text style={styles.label}>User Name</Text>
      <TextInput
        style={styles.input}
        value={userName}
        onChangeText={setUserName}
        placeholder="User name"
      />

      <Text style={styles.label}>User Address</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={userAddress}
        onChangeText={setUserAddress}
        placeholder="Address"
        multiline
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={(t) => setPhoneNumber(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="1234567890"
      />

      <TouchableOpacity style={[styles.btnUpdate, saving && styles.btnDisabled]} onPress={onUpdate} disabled={saving}>
        <Text style={styles.btnText}>{saving ? 'Updating...' : 'Update User'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnPassword}
        onPress={() => navigation.navigate('PAUserPasswordScreen', { userId })}
      >
        <Text style={styles.btnText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnDelete} onPress={onDelete}>
        <Text style={styles.btnText}>Delete User</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: '#fff', paddingBottom: 30 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 8, color: '#6b7280' },

  title: { fontSize: 22, fontWeight: '900', marginBottom: 12, color: '#111827' },

  idBox: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  idLabel: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 },
  idValue: { color: '#1e3a8a', fontWeight: '900', fontSize: 18, marginTop: 2 },

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

  btnUpdate: {
    backgroundColor: '#eab308',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  btnPassword: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDelete: {
    backgroundColor: '#b91c1c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});