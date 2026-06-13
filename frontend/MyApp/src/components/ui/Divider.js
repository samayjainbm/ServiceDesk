// src/components/ui/Divider.js
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';

export default function Divider({ style, inset = 0 }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border, marginLeft: inset }, style]} />;
}
