// src/components/ui/Field.js — label/value row for detail screens.
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';

export default function Field({ label, value, last }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ width: 104, color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '600', lineHeight: 21 }}>
        {value === null || value === undefined || value === '' ? '—' : String(value)}
      </Text>
    </View>
  );
}
