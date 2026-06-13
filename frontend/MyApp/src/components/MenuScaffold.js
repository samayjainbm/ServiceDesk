// src/components/MenuScaffold.js
// Shared dashboard/menu layout: role AppBar (+ optional logout), an optional
// hero card, and a list of navigable menu cards.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';
import { Screen, AppBar, Card, Avatar, Icon } from './ui';

export default function MenuScaffold({
  role,
  title,
  subtitle,
  items,
  onBack,
  onLogout,
  heroTitle,
  heroSubtitle,
  heroIcon,
  footer,
}) {
  const { colors, getRoleAccent } = useTheme();
  const accent = getRoleAccent(role).color;

  const right = onLogout ? (
    <Pressable
      onPress={onLogout}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Log out"
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="logout" size={22} color="#FFFFFF" />
    </Pressable>
  ) : null;

  return (
    <Screen
      header={<AppBar title={title} subtitle={subtitle} role={role} onBack={onBack} right={right} />}
      scroll
    >
      {heroTitle ? (
        <Card style={{ marginBottom: 16 }} accentBar={accent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
            <Avatar icon={heroIcon || 'user'} role={role} size={50} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '900' }}>{heroTitle}</Text>
              {heroSubtitle ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{heroSubtitle}</Text>
              ) : null}
            </View>
          </View>
        </Card>
      ) : null}

      <View style={{ gap: 12 }}>
        {items.map((it) => (
          <Card key={it.key || it.title} onPress={it.onPress} style={{ paddingVertical: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 2 }}>
              <Avatar icon={it.icon} role={role} size={44} color={it.accent} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '800' }}>{it.title}</Text>
                {it.desc ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{it.desc}</Text>
                ) : null}
              </View>
              <Icon name="chevronRight" size={22} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>

      {footer ? <View style={{ marginTop: 20 }}>{footer}</View> : null}
    </Screen>
  );
}
