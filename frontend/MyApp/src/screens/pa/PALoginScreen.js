// src/screens/pa/PALoginScreen.js
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

// const BASE_URL = 'http://192.168.0.111:3000';

export default function PALoginScreen({ navigation }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePALogin = async () => {
    const lid = loginId.trim();
    const pwd = password;

    if (!lid || !pwd) {return Alert.alert('Validation Error', 'Login ID and password are required');}
    if (!/^\d+$/.test(lid)) {return Alert.alert('Validation Error', 'Login ID must be numeric');}

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_pa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_id: lid, password: pwd }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {throw new Error(data?.message || 'PA login failed');}
      if (!data?.token) {throw new Error('Token not received from backend');}

      // ✅ CLEAR everything old + save ONLY pa_token
      await AsyncStorage.multiRemove(['pa_token', 'role', 'user_data', 'worker_user', 'pa_user', 'token']);
      await AsyncStorage.setItem('pa_token', data.token);
      await AsyncStorage.setItem('role', 'pa');

      await AsyncStorage.setItem(
        'pa_user',
        JSON.stringify({
          role: data?.role || 'pa',
          login_id: lid,
        })
      );

      navigation.reset({ index: 0, routes: [{ name: 'PAHomeScreen' }] });
    } catch (err) {
      console.log('PA login error:', err);
      Alert.alert('Login Failed', err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>PA Login</Text>
          <Text style={styles.subtitle}>Login with PA credentials</Text>

          <View style={styles.inputWrap}>
            <Text style={styles.label}>Login ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter PA login id"
              value={loginId}
              onChangeText={(text) => setLoginId(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
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
              editable={!loading}
            />
          </View>

          <TouchableOpacity style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handlePALogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, backgroundColor: '#f6f7fb', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 6, marginBottom: 16, color: '#6b7280', fontSize: 14 },
  inputWrap: { marginBottom: 14 },
  label: { marginBottom: 6, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', color: '#111827' },
  loginBtn: { marginTop: 6, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
