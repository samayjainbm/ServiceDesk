// screens/worker/WorkerLoginScreen.js
import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Jaisa tera setup hai waise hi rehne de
// const BASE_URL = 'http://192.168.0.111:3000';
// const BASE_URL = "http://localhost:3000";

export default function WorkerLoginScreen({ navigation }) {
  const [workerId, setWorkerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const wid = workerId.trim();
    const pwd = password;

    if (!wid || !pwd) {
      Alert.alert('Validation Error', 'Worker ID and password are required');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: wid,
          password: pwd,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ Save token + user info
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }

      // Optional: alag keys for worker
      await AsyncStorage.setItem('role', 'worker');
   await AsyncStorage.setItem('worker_id',String(wid));
// ya jo bhi response key ho: json.worker_id / json.worker.worker_id

      if (data.user) {
        await AsyncStorage.setItem('worker_user', JSON.stringify(data.user));
      }

      Alert.alert('Success', data.message || 'Login successful');

      // ✅ Navigate (apne navigator ke screen name ke hisaab se change kar lena)
      navigation.replace("WorkerComplaintsListScreen");
    } catch (err) {
      console.log('Worker login error:', err);
      Alert.alert('Login Failed', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Worker Login</Text>
          <Text style={styles.subtitle}>
            Login with worker credentials
          </Text>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Worker ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter worker id (e.g. 202)"
              value={workerId}
              onChangeText={setWorkerId}
              keyboardType="number-pad"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#f6f7fb',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  inputWrap: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: '#111827',
  },
  loginBtn: {
    marginTop: 6,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
