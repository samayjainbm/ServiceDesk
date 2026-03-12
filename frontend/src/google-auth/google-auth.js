// src/google-auth/google-auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID, BASE_URL, TOKEN_KEY } from '../../config';

/**
 * Call this once at app startup (e.g. App.js / index.js)
 */
export function initGoogleAuth() {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID, // MUST be "Web application" OAuth Client ID
    offlineAccess: false,              // keep false unless you need server auth code / refresh token
    forceCodeForRefreshToken: false,
    // scopes: ['profile', 'email'], // optional
  });
}

/**
 * Login with Google -> send idToken to backend -> receive app JWT token
 */
export async function googleLoginUser() {
  try {
    // 1) Ensure Play Services available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 2) Prevent stale session (very common during setup)
    // revokeAccess is stronger than signOut
    await GoogleSignin.revokeAccess().catch(() => {});
    await GoogleSignin.signOut().catch(() => {});

    // 3) Start sign-in
    const userInfo = await GoogleSignin.signIn();

    // 4) Get tokens
    const tokens = await GoogleSignin.getTokens();
    const idToken = tokens?.idToken;
    const accessToken = tokens?.accessToken;

    // Debug logs (remove later)
    console.log('Google userInfo:', userInfo);
    console.log('Google tokens:', { hasIdToken: !!idToken, hasAccessToken: !!accessToken });

    if (!idToken) throw new Error('No idToken received from Google');

    // 5) Send idToken to backend
    const res = await fetch(`${BASE_URL}/api/auth/google-auth/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || `Google login failed (HTTP ${res.status})`);
    }
    if (!data?.token) throw new Error('Token not received from backend');

    // 6) Store app token
    await AsyncStorage.multiRemove(['token', 'role', 'user_data', 'pa_token', 'pa_user']);
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem('role', 'user');
    await AsyncStorage.setItem('user_data', JSON.stringify(data.user || {}));

    return data;
  } catch (e) {
    // ---- Super important debugging for "non-recoverable sign in failure" ----
    console.log('Google Sign-In ERROR name:', e?.name);
    console.log('Google Sign-In ERROR code:', e?.code);
    console.log('Google Sign-In ERROR message:', e?.message);
    console.log('Google Sign-In ERROR full:', JSON.stringify(e, null, 2));

    // Make a cleaner message for UI
    if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google sign-in cancelled');
    }
    if (e?.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google sign-in already in progress');
    }
    if (e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available / outdated');
    }

    // This is the one you were getting earlier
    if (e?.code === statusCodes.DEVELOPER_ERROR) {
      // this error occurs when the OAuth client ID, package name, or SHA1
      // fingerprint is misconfigured.  Provide a message that's easier for
      // the end user to understand and includes next steps.
      throw new Error(
        'Your Google account is not authorized for this application.'
      );
    }

    // Fallback
    throw new Error(e?.message || 'Google sign-in failed');
  }
}

export async function googleLogout() {
  // revokeAccess removes granted permissions too
  await GoogleSignin.revokeAccess().catch(() => {});
  await GoogleSignin.signOut().catch(() => {});
}