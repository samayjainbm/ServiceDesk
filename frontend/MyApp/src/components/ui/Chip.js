// src/components/ui/Chip.js
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../../theme';

export default function Chip({ label, selected, onPress, accent }) {
  const { colors, radius } = useTheme();
  const active = accent || colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: selected ? active : colors.surface,
        borderWidth: 1.5,
        borderColor: selected ? active : colors.border,
      }}
    >
      <Text style={{ color: selected ? '#FFFFFF' : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
