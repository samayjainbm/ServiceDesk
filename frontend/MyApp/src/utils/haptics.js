// src/utils/haptics.js — subtle haptic feedback via core Vibration (no native dep).
import { Vibration, Platform } from 'react-native';

export function tap() {
  try { Vibration.vibrate(Platform.OS === 'android' ? 10 : 8); } catch (e) {}
}

export function success() {
  try { Vibration.vibrate([0, 12, 45, 14]); } catch (e) {}
}
