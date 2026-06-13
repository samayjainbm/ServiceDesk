// src/hooks/useAuth.js
// Centralized session read/clear. Uses the SAME AsyncStorage keys as before.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../../config';

const SESSION_KEYS = [TOKEN_KEY, 'role', 'user_data', 'pa_token', 'pa_user'];

export async function getSession() {
  const pairs = await AsyncStorage.multiGet(SESSION_KEYS);
  const map = Object.fromEntries(pairs);
  let user = null;
  let pa = null;
  try { user = map.user_data ? JSON.parse(map.user_data) : null; } catch (e) {}
  try { pa = map.pa_user ? JSON.parse(map.pa_user) : null; } catch (e) {}
  return {
    token: map[TOKEN_KEY] || null,
    role: map.role || null,
    user,
    paToken: map.pa_token || null,
    pa,
  };
}

export async function clearSession() {
  await AsyncStorage.multiRemove(SESSION_KEYS);
}
