// src/components/ui/Skeleton.js
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../../theme';

export function Skeleton({ width = '100%', height = 16, radius = 8, style }) {
  const { colors } = useTheme();
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return (
    <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.skeleton, opacity: o }, style]} />
  );
}

export function SkeletonCard() {
  const { colors, radius, spacing } = useTheme();
  return (
    <Animated.View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        marginBottom: spacing.md,
      }}
    >
      <Skeleton width={'55%'} height={16} />
      <Skeleton width={'85%'} height={12} style={{ marginTop: 12 }} />
      <Skeleton width={'40%'} height={12} style={{ marginTop: 8 }} />
    </Animated.View>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
