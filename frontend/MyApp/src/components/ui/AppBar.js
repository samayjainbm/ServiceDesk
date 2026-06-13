// src/components/ui/AppBar.js — gradient (MANIT-blue / role-tinted) immersive bar.
import React from 'react';
import { View, Text, Pressable, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, shade } from '../../theme';
import Icon from './Icon';

export default function AppBar({ title, subtitle, onBack, right, left, role, immersive = true, center = false }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  // Always MANIT-blue gradient (matches the approved design + guarantees
  // high-contrast white text). Role identity shows via avatars/accent bars.
  const gradientColors = colors.gradient;
  const fg = immersive ? '#FFFFFF' : colors.textPrimary;
  const subFg = immersive ? 'rgba(255,255,255,0.88)' : colors.textSecondary;

  const Bar = (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 }}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={26} color={fg} />
        </Pressable>
      ) : (left || <View style={{ width: 12 }} />)}
      <View style={{ flex: 1, alignItems: center ? 'center' : 'flex-start', paddingHorizontal: 6 }}>
        <Text numberOfLines={1} style={{ color: fg, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 }}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={{ color: subFg, fontSize: 12, fontWeight: '600', marginTop: 1 }}>{subtitle}</Text> : null}
      </View>
      <View style={{ minWidth: 44, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 4 }}>{right}</View>
    </View>
  );

  if (!immersive) {
    return (
      <View style={{ backgroundColor: colors.surface, paddingTop: insets.top, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
        {Bar}
      </View>
    );
  }

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor={gradientColors[0]} />
      {Bar}
    </LinearGradient>
  );
}
