import React from 'react';
import { View, Text, StatusBar, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Screen, Card, Icon, Avatar } from '../components/ui';
import Crest from '../components/brand/Crest';

const ROLES = [
  { key: 'user', title: 'User Portal', desc: 'Register and track your complaints', icon: 'user', route: 'UserLoginScreen' },
  { key: 'worker', title: 'Worker Portal', desc: 'Your assigned tasks and materials', icon: 'clipboard', route: 'WorkerLoginScreen' },
  { key: 'inventory', title: 'Inventory Portal', desc: 'Items, stock and demand requests', icon: 'box', route: 'Login' },
  { key: 'pa', title: 'Administration', desc: 'Manage users, workers and records', icon: 'users', route: 'PALoginScreen' },
];

export default function Home({ navigation }) {
  const { colors, brand, getRoleAccent, isDark, toggleTheme, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Screen scroll padded={false} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradient[0]} />

      {/* Branded gradient header */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 18,
          paddingBottom: 26,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 26,
          borderBottomRightRadius: 26,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Crest size={46} onDark />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.3 }}>{brand.appName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>{brand.shortName}</Text>
          </View>
          <Pressable
            onPress={toggleTheme}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={isDark ? 'sun' : 'moon'} size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={{ color: colors.gold, fontSize: 12.5, fontWeight: '700', fontStyle: 'italic', marginTop: 16 }}>
          "{brand.motto}"
        </Text>
      </LinearGradient>

      {/* Role picker */}
      <View style={{ padding: 20 }}>
        <Text style={{ ...typography.overline, color: colors.textMuted, marginBottom: 14 }}>CHOOSE YOUR PORTAL</Text>

        <View style={{ gap: 12 }}>
          {ROLES.map((r) => {
            const accent = getRoleAccent(r.key).color;
            return (
              <Card key={r.key} onPress={() => navigation.navigate(r.route)} accentBar={accent} style={{ paddingVertical: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 6 }}>
                  <Avatar icon={r.icon} role={r.key} size={48} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 16.5, fontWeight: '800' }}>{r.title}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{r.desc}</Text>
                  </View>
                  <Icon name="chevronRight" size={22} color={colors.textMuted} />
                </View>
              </Card>
            );
          })}
        </View>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '600', textAlign: 'center' }}>{brand.status}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 11.5, textAlign: 'center', marginTop: 3 }}>
            {brand.established} · Bhopal, M.P.
          </Text>
        </View>
      </View>
    </Screen>
  );
}
