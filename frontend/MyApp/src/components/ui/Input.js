// src/components/ui/Input.js
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import Icon from './Icon';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  secureTextEntry,
  leftIcon,
  rightSlot,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  onSubmitEditing,
  returnKeyType,
  maxLength,
  multiline,
  style,
}) {
  const { colors, radius, spacing, typography } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hide, setHide] = useState(!!secureTextEntry);

  const borderColor = error ? colors.danger : focused ? colors.primaryInteractive : colors.border;

  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label ? (
        <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: colors.inputBg,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor,
          paddingHorizontal: 12,
          minHeight: 50,
        }}
      >
        {leftIcon ? (
          <View style={{ marginRight: 8, paddingTop: multiline ? 14 : 0 }}>
            <Icon name={leftIcon} size={18} color={focused ? colors.primaryInteractive : colors.textMuted} />
          </View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hide}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            color: colors.textPrimary,
            fontSize: 16,
            paddingVertical: multiline ? 12 : 0,
            minHeight: multiline ? 96 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHide((h) => !h)} hitSlop={10} style={{ paddingLeft: 8 }}>
            <Icon name={hide ? 'eye' : 'eyeOff'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : rightSlot ? (
          <View style={{ paddingLeft: 8 }}>{rightSlot}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 5, fontWeight: '600' }}>{error}</Text>
      ) : helper ? (
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 5 }}>{helper}</Text>
      ) : null}
    </View>
  );
}
