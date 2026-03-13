import React, { useEffect, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from "../../../config";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleLoginUser } from '../../google-auth/google-auth';

export default function UserLoginScreen({ navigation }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  const fetchCaptcha = async () => {
    try {
      setCaptchaLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_user/captcha`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const raw = await res.text();
      let data;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`Non-JSON response (HTTP ${res.status})`);
      }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Captcha fetch failed (HTTP ${res.status})`);
      }

      if (!data?.captchaId || !data?.question) {
        throw new Error('Invalid captcha response from server');
      }

      setCaptchaId(data.captchaId);
      setCaptchaQuestion(data.question);
      setCaptchaAnswer('');
    } catch (e) {
      Alert.alert('Captcha Error', e?.message || 'Could not load captcha');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const login = async () => {
    const uid = id.trim();
    const pwd = password;
    const captcha = captchaAnswer.trim();

    if (!uid || !pwd) {
      return Alert.alert('Warning', 'ID and password required');
    }

    if (!/^\d+$/.test(uid)) {
      return Alert.alert('Warning', 'ID must be numeric');
    }

    if (!captchaId) {
      return Alert.alert('Warning', 'Captcha not loaded yet. Please refresh.');
    }

    if (!captcha) {
      return Alert.alert('Warning', 'Captcha required');
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/login_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: uid,
          password: pwd,
          captchaId,
          captchaAnswer: captcha,
        }),
      });

      const raw = await res.text();
      let data;

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`Non-JSON response (HTTP ${res.status})`);
      }

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || `Login failed (HTTP ${res.status})`);
      }

      if (!data?.token) {
        throw new Error('Token not received');
      }

      await AsyncStorage.multiRemove(['token', 'role', 'user_data', 'pa_token', 'pa_user']);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem('role', 'user');
      await AsyncStorage.setItem(
        'user_data',
        JSON.stringify(data.user || { user_id: Number(uid) })
      );

      setCaptchaAnswer('');
      setCaptchaId('');
      setCaptchaQuestion('');

      navigation.reset({
        index: 0,
        routes: [{ name: 'UserHomeScreen' }],
      });
    } catch (e) {
      Alert.alert('Login Failed', e?.message || 'Something went wrong');
      await fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await googleLoginUser();
      navigation.reset({
        index: 0,
        routes: [{ name: 'UserHomeScreen' }],
      });
    } catch (e) {
      console.log("Google login error:", e);
      Alert.alert("Google Login Failed", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

          <View style={styles.captchaHeader}>
            <Text style={styles.label}>Captcha</Text>
            <TouchableOpacity
              onPress={fetchCaptcha}
              disabled={loading || captchaLoading}
            >
              <Text style={styles.refreshText}>
                {captchaLoading ? 'Loading...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.captchaBox}>
            <Text style={styles.captchaText}>
              {captchaLoading
                ? 'Loading captcha...'
                : (captchaQuestion || 'Captcha not available')}
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter captcha answer"
            value={captchaAnswer}
            onChangeText={setCaptchaAnswer}
            keyboardType="number-pad"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={login}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.googleBtn, loading && styles.btnDisabled]}
            onPress={loginWithGoogle}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.googleBtnText}>Continue with Google</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#f6f7fb',
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
    fontWeight: '900',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  captchaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captchaBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
  },
  captchaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  refreshText: {
    color: '#2563eb',
    fontWeight: '800',
    marginTop: 10,
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleBtn: {
    marginTop: 10,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  googleBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});
