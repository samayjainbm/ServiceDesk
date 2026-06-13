// src/components/ui/Avatar.js
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import Icon from './Icon';

export default function Avatar({ name, size = 44, role, icon, color }) {
  const { colors, getRoleAccent } = useTheme();
  const accent = color || (role ? getRoleAccent(role).color : colors.primary);
  const initials =
    (name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => (s[0] ? s[0].toUpperCase() : ''))
      .join('') || null;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: accent + '22',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: accent + '40',
      }}
    >
      {initials ? (
        <Text style={{ color: accent, fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
      ) : (
        <Icon name={icon || 'user'} size={size * 0.5} color={accent} />
      )}
    </View>
  );
}
