// src/components/ui/Screen.js
// Standard screen scaffold: safe-area, optional fixed header (AppBar), scroll
// body with pull-to-refresh, keyboard handling, and a fixed footer slot.
import React from 'react';
import {
  View, ScrollView, KeyboardAvoidingView, Platform, StatusBar, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export default function Screen({
  children,
  header,
  footer,
  scroll = false,
  padded = true,
  bg,
  edges,
  refreshing,
  onRefresh,
  keyboardAvoiding = false,
  contentStyle,
  style,
}) {
  const { colors, spacing } = useTheme();
  const background = bg || colors.bg;
  const pad = padded ? { padding: spacing.lg } : null;
  // When a header is present it paints the top inset itself.
  const safeEdges = edges || (header ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']);

  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[{ flexGrow: 1 }, pad, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
  );

  const inner = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : body;

  return (
    <SafeAreaView edges={safeEdges} style={[{ flex: 1, backgroundColor: background }, style]}>
      <StatusBar
        barStyle={colors.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={background}
      />
      {header}
      {inner}
      {footer}
    </SafeAreaView>
  );
}
