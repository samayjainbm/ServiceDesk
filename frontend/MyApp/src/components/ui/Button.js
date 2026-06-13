// src/components/ui/Button.js — gradient fills + animated press + subtle haptic.
import React, { useRef } from 'react';
import { Pressable, Text, Animated, ActivityIndicator, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme, shade } from '../../theme';
import Icon from './Icon';
import { tap } from '../../utils/haptics';

export default function Button({
  title, onPress, variant = 'primary', size = 'md', icon, iconRight,
  loading = false, disabled = false, fullWidth = true, accent, style, textStyle,
}) {
  const { colors, radius } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();

  const sizes = {
    sm: { h: 40, px: 14, font: 14, icon: 16 },
    md: { h: 50, px: 18, font: 16, icon: 18 },
    lg: { h: 56, px: 22, font: 17, icon: 20 },
  }[size];

  const primaryColor = accent || colors.primary;
  let gradientColors = null;
  let solidBg = null;
  let fg = '#FFFFFF';
  let border = 'transparent';

  if (variant === 'primary') { gradientColors = [accent ? shade(accent, 0.12) : colors.primaryInteractive, primaryColor]; fg = colors.onPrimary; }
  else if (variant === 'accent') { gradientColors = [colors.accent, colors.accentPressed]; fg = colors.onAccent; }
  else if (variant === 'danger') { gradientColors = [colors.danger, shade(colors.danger, -0.16)]; fg = '#FFFFFF'; }
  else if (variant === 'secondary') { solidBg = colors.surface; fg = colors.textPrimary; border = colors.borderStrong; }
  else if (variant === 'ghost') { solidBg = 'transparent'; fg = primaryColor; }

  const isDisabled = disabled || loading;
  const rowStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: sizes.h, paddingHorizontal: sizes.px };
  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <>
      {icon ? <Icon name={icon} size={sizes.icon} color={fg} /> : null}
      <Text style={[{ color: fg, fontSize: sizes.font, fontWeight: '800', letterSpacing: 0.3 }, textStyle]}>{title}</Text>
      {iconRight ? <Icon name={iconRight} size={sizes.icon} color={fg} /> : null}
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }], width: fullWidth ? '100%' : undefined, opacity: isDisabled ? 0.55 : 1 }, style]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => { animate(0.97); if (!isDisabled) tap(); }}
        onPressOut={() => animate(1)}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        android_ripple={{ color: 'rgba(255,255,255,0.16)' }}
        style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: border === 'transparent' ? 0 : 1.5, borderColor: border, backgroundColor: solidBg || 'transparent' }}
      >
        {gradientColors ? (
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={rowStyle}>
            {content}
          </LinearGradient>
        ) : (
          <View style={rowStyle}>{content}</View>
        )}
      </Pressable>
    </Animated.View>
  );
}
