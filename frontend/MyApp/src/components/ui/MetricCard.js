// src/components/ui/MetricCard.js
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import Icon from './Icon';

export default function MetricCard({ label, value, icon, accent, style }) {
  const { colors, radius, spacing, elevation } = useTheme();
  const c = accent || colors.primary;
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.lg,
          ...elevation[1],
        },
        style,
      ]}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: c + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon name={icon || 'box'} size={20} color={c} />
      </View>
      <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}
