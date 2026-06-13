// src/components/ui/SegmentedControl.js
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme';

export default function SegmentedControl({ options, value, onChange, scrollable = false, accent }) {
  const { colors, radius } = useTheme();
  const active = accent || colors.primary;

  const items = options.map((opt) => {
    const val = typeof opt === 'string' ? opt : opt.value;
    const label = typeof opt === 'string' ? opt : opt.label;
    const sel = val === value;

    if (scrollable) {
      return (
        <Pressable
          key={String(val)}
          onPress={() => onChange(val)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: radius.pill,
            backgroundColor: sel ? active : colors.surface,
            borderWidth: 1.5,
            borderColor: sel ? active : colors.border,
          }}
        >
          <Text style={{ color: sel ? '#FFFFFF' : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        </Pressable>
      );
    }
    return (
      <Pressable
        key={String(val)}
        onPress={() => onChange(val)}
        style={{
          flex: 1,
          paddingVertical: 9,
          borderRadius: radius.sm,
          alignItems: 'center',
          backgroundColor: sel ? colors.surface : 'transparent',
          borderWidth: sel ? 1 : 0,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: sel ? colors.textPrimary : colors.textSecondary, fontWeight: '700', fontSize: 13 }}>
          {label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {items}
      </ScrollView>
    );
  }
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, gap: 4 }}>
      {items}
    </View>
  );
}
