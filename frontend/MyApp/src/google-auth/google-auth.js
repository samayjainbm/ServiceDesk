// src/google-auth/google-auth.js
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, BASE_URL, TOKEN_KEY } from '../../config';

let googleConfigured = false;

/**
 * Configure Google Sign-In once
 */
export function initGoogleAuth() {
  if (googleConfigured) return;

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });

  googleConfigured = true;
}

/**
 * Login with Google -> send idToken to backend -> receive app JWT token
 */
export async function googleLoginUser() {
  try {
    initGoogleAuth();

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    await GoogleSignin.revokeAccess().catch(() => {});
    await GoogleSignin.signOut().catch(() => {});

    const userInfo = await GoogleSignin.signIn();

    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens?.idToken;
    const accessToken = tokens?.accessToken;

    console.log('Google userInfo:', userInfo);
    console.log('Google tokens:', {
      hasIdToken: !!idToken,
      hasAccessToken: !!accessToken,
    });

    if (!idToken) {
      throw new Error('No idToken received from Google');
    }

    const res = await fetch(`${BASE_URL}/api/auth/google-auth/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const raw = await res.text();
    let data;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`Non-JSON backend response (HTTP ${res.status})`);
    }

    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || `Google login failed (HTTP ${res.status})`);
    }

    if (!data?.token) {
      throw new Error('Token not received from backend');
    }

    await AsyncStorage.multiRemove(['token', 'role', 'user_data', 'pa_token', 'pa_user']);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem('role', 'user');
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user || {}));

    return data;
  } catch (e) {
    console.log('Google Sign-In ERROR name:', e?.name);
    console.log('Google Sign-In ERROR code:', e?.code);
    console.log('Google Sign-In ERROR message:', e?.message);
    console.log('Google Sign-In ERROR full:', JSON.stringify(e, null, 2));

    Alert.alert(
      'Google Debug',
      `code: ${e?.code || 'N/A'}\nmessage: ${e?.message || 'N/A'}`
    );

    if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in cancelled');
    }

    if (e?.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google sign-in already in progress');
    }

    if (e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available or outdated');
    }

    if (e?.code === statusCodes.DEVELOPER_ERROR) {
      throw new Error(
        'Google sign-in is not set up correctly on this build. Please check OAuth client, package name, and SHA fingerprint.'
      );
    }

    throw new Error(e?.message || 'Google sign-in failed');
  }
}

export async function googleLogout() {
  await GoogleSignin.revokeAccess().catch(() => {});
  await GoogleSignin.signOut().catch(() => {});
}