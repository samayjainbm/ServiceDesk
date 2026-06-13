// src/components/ui/Badge.js
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { statusMeta } from '../../utils/status';

export function Badge({ label, color, tint, size = 'md', dot = false, style }) {
  const { colors, radius } = useTheme();
  const fg = color || colors.primary;
  const bg = tint || colors.primaryTint;
  const pad = size === 'sm' ? { h: 22, px: 8, font: 11 } : { h: 26, px: 11, font: 12 };
  return (
    <View
      style={[
        {
          height: pad.h,
          paddingHorizontal: pad.px,
          backgroundColor: bg,
          borderRadius: radius.pill,
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
        },
        style,
      ]}
    >
      {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: fg }} /> : null}
      <Text style={{ color: fg, fontSize: pad.font, fontWeight: '800', letterSpacing: 0.2 }}>{label}</Text>
    </View>
  );
}

export function StatusPill({ status, size = 'md' }) {
  const { colors } = useTheme();
  const meta = statusMeta(status, colors);
  return <Badge label={meta.label} color={meta.color} tint={meta.tint} size={size} dot />;
}
