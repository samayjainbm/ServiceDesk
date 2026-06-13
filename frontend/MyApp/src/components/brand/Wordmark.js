// src/components/brand/Wordmark.js
// "MANIT ServiceDesk" lockup — crest + name + subtitle. Used on splash/home/logins.
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import Crest from './Crest';

export default function Wordmark({ size = 64, onDark = false, align = 'center', showSubtitle = true }) {
  const { colors, brand } = useTheme();
  const main = onDark ? '#FFFFFF' : colors.textPrimary;
  const sub = onDark ? 'rgba(255,255,255,0.8)' : colors.textSecondary;
  const center = align === 'center';

  return (
    <View style={{ alignItems: center ? 'center' : 'flex-start' }}>
      <Crest size={size} onDark={onDark} />
      <Text style={{ marginTop: 12, fontSize: size * 0.34, fontWeight: '900', color: main, letterSpacing: 0.3, textAlign: center ? 'center' : 'left' }}>
        {brand.appName}
      </Text>
      {showSubtitle && (
        <Text style={{ marginTop: 2, fontSize: size * 0.2, fontWeight: '600', color: sub, textAlign: center ? 'center' : 'left' }}>
          {brand.shortName}
        </Text>
      )}
    </View>
  );
}
