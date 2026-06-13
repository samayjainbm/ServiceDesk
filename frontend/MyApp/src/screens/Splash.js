import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme';
import Crest from '../components/brand/Crest';

const TOP = '#143F94';
const BOTTOM = '#0A357E';

export default function Splash({ navigation }) {
  const { brand, colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;

  const go = () => navigation.replace('Home');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, useNativeDriver: true, bounciness: 6, speed: 10 }),
    ]).start();
    const t = setTimeout(go, 1700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient colors={[TOP, BOTTOM]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={TOP} />
      <Pressable onPress={go} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
          <Crest size={118} onDark />
          <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 22, letterSpacing: 0.3 }}>
            {brand.appName}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', marginTop: 6 }}>
            {brand.shortName}
          </Text>
          <View style={{ height: 1.5, width: 64, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 18 }} />
          <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '700', fontStyle: 'italic', textAlign: 'center' }}>
            "{brand.motto}"
          </Text>
        </Animated.View>

        <Animated.Text
          style={{
            position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.75)', fontSize: 11,
            fontWeight: '600', textAlign: 'center', opacity: fade, paddingHorizontal: 24,
          }}
        >
          {brand.status} · {brand.established}
        </Animated.Text>
      </Pressable>
    </LinearGradient>
  );
}
