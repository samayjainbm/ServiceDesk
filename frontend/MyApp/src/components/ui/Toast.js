// src/components/ui/Toast.js
// Global, non-blocking toast/snackbar. Replaces Alert.alert for feedback.
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Animated, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import Icon from './Icon';

const ToastContext = createContext({
  show: () => {}, success: () => {}, error: () => {}, info: () => {}, warning: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const { colors, radius, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const y = useRef(new Animated.Value(140)).current;
  const timer = useRef(null);

  const hide = useCallback(() => {
    Animated.timing(y, { toValue: 140, duration: 200, useNativeDriver: true }).start(() => setToast(null));
  }, [y]);

  const show = useCallback(
    (message, type = 'info', duration = 2800) => {
      if (!message) return;
      if (timer.current) clearTimeout(timer.current);
      setToast({ message: String(message), type });
      Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 6, speed: 14 }).start();
      timer.current = setTimeout(hide, duration);
    },
    [y, hide]
  );

  const palette = {
    success: { c: colors.success, t: colors.successTint, icon: 'checkCircle' },
    error: { c: colors.danger, t: colors.dangerTint, icon: 'alert' },
    info: { c: colors.info, t: colors.infoTint, icon: 'info' },
    warning: { c: colors.warning, t: colors.warningTint, icon: 'alert' },
  };
  const meta = toast ? palette[toast.type] || palette.info : palette.info;

  const value = {
    show,
    success: (m, d) => show(m, 'success', d),
    error: (m, d) => show(m, 'error', d),
    info: (m, d) => show(m, 'info', d),
    warning: (m, d) => show(m, 'warning', d),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16, transform: [{ translateY: y }] }}
        >
          <Pressable
            onPress={hide}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 13,
              paddingHorizontal: 14,
              ...elevation[3],
            }}
          >
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: meta.t, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={meta.icon} size={18} color={meta.c} />
            </View>
            <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600', lineHeight: 19 }}>
              {toast.message}
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
