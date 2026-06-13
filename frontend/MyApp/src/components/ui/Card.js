// src/components/ui/Card.js
import React, { useRef } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { useTheme } from '../../theme';

export default function Card({ children, onPress, style, padded = true, elevation = 1, accentBar }) {
  const { colors, radius, spacing, elevation: elev } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const base = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padded ? spacing.lg : 0,
    overflow: 'hidden',
    ...elev[elevation],
  };

  const accentStripe = accentBar ? (
    <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: accentBar }} />
  ) : null;

  if (!onPress) {
    return (
      <View style={[base, style]}>
        {accentStripe}
        {children}
      </View>
    );
  }

  const animate = (to) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animate(0.98)}
        onPressOut={() => animate(1)}
        android_ripple={{ color: colors.surfaceAlt }}
        style={[base, style]}
      >
        {accentStripe}
        {children}
      </Pressable>
    </Animated.View>
  );
}
