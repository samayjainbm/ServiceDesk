import React, { useEffect, useState } from 'react';
import { BASE_URL, TOKEN_KEY } from '../../../config';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { googleLoginUser } from '../../google-auth/google-auth';
import { useTheme } from '../../theme';
import AuthScaffold from '../../components/AuthScaffold';
import { Input, Button, Icon, useToast } from '../../components/ui';

export default function UserLoginScreen({ navigation }) {
  const { colors, radius } = useTheme();
  const toast = useToast();

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
        headers: { Accept: 'application/json' },
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
      toast.error(e?.message || 'Could not load captcha');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    const uid = id.trim();
    const pwd = password;
    const captcha = captchaAnswer.trim();

    if (!uid || !pwd) { return toast.warning('ID and password required'); }
    if (!/^\d+$/.test(uid)) { return toast.warning('ID must be numeric'); }
    if (!captchaId) { return toast.warning('Captcha not loaded yet. Please refresh.'); }
    if (!captcha) { return toast.warning('Captcha required'); }

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
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user || { user_id: Number(uid) }));

      setCaptchaAnswer('');
      setCaptchaId('');
      setCaptchaQuestion('');

      navigation.reset({ index: 0, routes: [{ name: 'UserHomeScreen' }] });
    } catch (e) {
      toast.error(e?.message || 'Something went wrong');
      await fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await googleLoginUser();
      navigation.reset({ index: 0, routes: [{ name: 'UserHomeScreen' }] });
    } catch (e) {
      console.log('Google login error:', e);
      toast.error(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold role="user" title="User Login" caption="Sign in to register and track complaints" onBack={() => navigation.goBack()}>
      <Input
        label="User ID"
        leftIcon="user"
        placeholder="e.g. 5"
        value={id}
        onChangeText={(t) => setId(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        editable={!loading}
      />
      <Input
        label="Password"
        leftIcon="lock"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      {/* Captcha */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }}>CAPTCHA</Text>
        <Pressable onPress={fetchCaptcha} disabled={loading || captchaLoading} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="refresh" size={15} color={colors.primaryInteractive} />
          <Text style={{ color: colors.primaryInteractive, fontWeight: '800', fontSize: 13 }}>
            {captchaLoading ? 'Loading…' : 'Refresh'}
          </Text>
        </Pressable>
      </View>
      <View
        style={{
          backgroundColor: colors.surfaceAlt,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 14,
          paddingHorizontal: 14,
          marginBottom: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: 2 }}>
          {captchaLoading ? 'Loading captcha…' : captchaQuestion || 'Captcha not available'}
        </Text>
      </View>
      <Input
        leftIcon="check"
        placeholder="Enter captcha answer"
        value={captchaAnswer}
        onChangeText={setCaptchaAnswer}
        keyboardType="number-pad"
        editable={!loading}
      />

      <Button title="Login" iconRight="chevronRight" onPress={login} loading={loading} style={{ marginTop: 4 }} />

      {/* Divider */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ marginHorizontal: 10, color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>OR</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <Button title="Continue with Google" variant="secondary" icon="mail" onPress={loginWithGoogle} loading={loading} />
    </AuthScaffold>
  );
}
