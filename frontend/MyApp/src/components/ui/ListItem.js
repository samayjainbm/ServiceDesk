// src/components/ui/ListItem.js
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import Icon from './Icon';

export default function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  value,
  onPress,
  showChevron = true,
  danger,
  style,
}) {
  const { colors } = useTheme();
  const Comp = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      android_ripple={onPress ? { color: colors.surfaceAlt } : undefined}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, gap: 12 }, style]}
    >
      {leading ? <View>{leading}</View> : null}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ color: danger ? colors.danger : colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={{ color: colors.textSecondary, fontWeight: '700', marginRight: 2 }}>{value}</Text> : null}
      {trailing ? trailing : onPress && showChevron ? <Icon name="chevronRight" size={20} color={colors.textMuted} /> : null}
    </Comp>
  );
}
