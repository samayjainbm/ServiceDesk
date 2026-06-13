// src/components/ui/EmptyState.js
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import Icon from './Icon';
import Button from './Button';

export default function EmptyState({
  icon = 'box',
  title = 'Nothing here yet',
  subtitle,
  actionLabel,
  onAction,
  compact = false,
}) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: compact ? spacing['2xl'] : spacing['4xl'],
        paddingHorizontal: spacing.xl,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Icon name={icon} size={34} color={colors.textMuted} />
      </View>
      <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
      {subtitle ? (
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: spacing.lg }}>
          <Button title={actionLabel} onPress={onAction} fullWidth={false} size="sm" variant="secondary" icon="refresh" />
        </View>
      ) : null}
    </View>
  );
}
