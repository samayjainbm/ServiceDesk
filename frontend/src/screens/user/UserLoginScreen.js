import React, { useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ ADD THIS IMPORT ONLY
import { googleLoginUser } from '../../google-auth/google-auth';

export default function UserLoginScreen({ navigation }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const uid = id.trim();
    const pwd = password;

    if (!uid || !pwd) {return Alert.alert('Warning', 'ID and password required');}
    if (!/^\d+$/.test(uid)) {return Alert.alert('Warning', 'ID must be numeric');}

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: uid, password: pwd }),
      });

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : {}; }
      catch { throw new Error(`Non-JSON response (HTTP ${res.status})`); }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Login failed (HTTP ${res.status})`);
      }

      if (!data?.token) {throw new Error('Token not received');}

      await AsyncStorage.multiRemove(['token', 'role', 'user_data', 'pa_token', 'pa_user']);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem('role', 'user');
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user || { user_id: Number(uid) }));

      navigation.reset({ index: 0, routes: [{ name: 'UserHomeScreen' }] });
    } catch (e) {
      Alert.alert('Login Failed', e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ADD THIS FUNCTION
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await googleLoginUser(); // ✅ does everything: google -> backend -> token save
      navigation.reset({ index: 0, routes: [{ name: 'UserHomeScreen' }] });
    } catch (e) {
      console.log("Google login error:", e);
      Alert.alert("Google Login Failed", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>User Login</Text>

          <Text style={styles.label}>User ID</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={id}
            onChangeText={(t) => setId(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="User@9000000005"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={login} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
          </TouchableOpacity>

          {/* ✅ ADD ONLY THIS BUTTON */}
          <TouchableOpacity style={[styles.googleBtn, loading && styles.btnDisabled]} onPress={loginWithGoogle} disabled={loading}>
            {loading ? <ActivityIndicator /> : <Text style={styles.googleBtnText}>Continue with Google</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', backgroundColor: '#f6f7fb', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 12 },
  label: { fontWeight: '800', color: '#111827', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' },
  btn: { marginTop: 16, backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  googleBtn: { marginTop: 10, backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  googleBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});