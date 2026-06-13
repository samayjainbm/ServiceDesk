// src/components/AuthScaffold.js
// Shared, branded shell for every login screen: role-tinted AppBar, centered
// MANIT crest + heading, a form Card, and the institute motto.
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';
import { Screen, AppBar, Card } from './ui';
import Crest from './brand/Crest';

export default function AuthScaffold({ role, title, caption, onBack, children }) {
  const { colors, brand } = useTheme();
  return (
    <Screen
      header={<AppBar title={title} subtitle={brand.shortName} role={role} onBack={onBack} />}
      scroll
      keyboardAvoiding
      contentStyle={{ flexGrow: 1, justifyContent: 'center' }}
    >
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <Crest size={66} />
        <Text style={{ color: colors.textPrimary, fontSize: 21, fontWeight: '900', marginTop: 14 }}>
          {brand.appName}
        </Text>
        {caption ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            {caption}
          </Text>
        ) : null}
      </View>

      <Card elevation={2}>{children}</Card>

      <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 22 }}>
        “{brand.motto}”
      </Text>
    </Screen>
  );
}
