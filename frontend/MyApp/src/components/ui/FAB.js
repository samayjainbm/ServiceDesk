// src/components/ui/FAB.js
import React, { useRef } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import Icon from './Icon';

export default function FAB({ icon = 'plus', label, onPress, accent }) {
  const { colors, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const bg = accent || colors.accent;

  return (
    <Animated.View style={{ position: 'absolute', right: 18, bottom: insets.bottom + 18, transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animate(0.95)}
        onPressOut={() => animate(1)}
        accessibilityRole="button"
        accessibilityLabel={label || 'Action'}
        style={{
          height: 56,
          borderRadius: 28,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: label ? 20 : 0,
          width: label ? undefined : 56,
          gap: 8,
          ...elevation[3],
        }}
      >
        <Icon name={icon} size={24} color="#FFFFFF" />
        {label ? <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>{label}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}
