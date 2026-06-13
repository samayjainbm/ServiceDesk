// src/components/brand/Crest.js
// MANIT seal/crest. Uses the official logo if dropped at
// src/assets/brand/manit-logo.png; otherwise renders a clean built-in
// circular seal so the app always looks finished.
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import MANIT_LOGO from './logo';

export default function Crest({ size = 72, onDark = false, ring = true }) {
  const { colors } = useTheme();

  if (MANIT_LOGO) {
    const pad = Math.max(4, size * 0.08);
    return (
      <View
        accessibilityLabel="MANIT Bhopal logo"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          padding: pad,
          borderWidth: 1,
          borderColor: 'rgba(11,61,145,0.12)',
          shadowColor: '#0B1220',
          shadowOpacity: 0.18,
          shadowRadius: size * 0.12,
          shadowOffset: { width: 0, height: size * 0.03 },
          elevation: 4,
        }}
      >
        <Image
          source={MANIT_LOGO}
          style={{ width: size - pad * 2, height: size - pad * 2, resizeMode: 'contain' }}
        />
      </View>
    );
  }

  const base = onDark ? '#FFFFFF' : colors.primary;
  const inner = onDark ? 'rgba(255,255,255,0.12)' : colors.primaryTint;
  const textOnInner = onDark ? '#FFFFFF' : colors.primary;

  return (
    <View
      accessibilityLabel="MANIT Bhopal crest"
      style={[
        styles.outer,
        {
          width: size, height: size, borderRadius: size / 2,
          borderColor: base, borderWidth: ring ? Math.max(2, size * 0.04) : 0,
          backgroundColor: inner,
        },
      ]}
    >
      <View style={[styles.innerRing, {
        width: size * 0.74, height: size * 0.74, borderRadius: size,
        borderColor: base, borderWidth: Math.max(1, size * 0.018),
      }]}>
        <Text style={{ color: textOnInner, fontWeight: '900', fontSize: size * 0.26, letterSpacing: 1 }}>
          MANIT
        </Text>
        <View style={{ width: size * 0.34, height: Math.max(1.5, size * 0.022), backgroundColor: base, marginVertical: size * 0.04, borderRadius: 2 }} />
        <Text style={{ color: textOnInner, fontWeight: '700', fontSize: size * 0.11, letterSpacing: 2 }}>
          BHOPAL
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center' },
  innerRing: { alignItems: 'center', justifyContent: 'center' },
});
