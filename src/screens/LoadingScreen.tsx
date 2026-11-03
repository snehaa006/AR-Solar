import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const MESSAGES = ['Igniting the Sun', 'Charting orbits', 'Painting planetary surfaces', 'Aligning the stars'];

/** Cinematic splash shown while fonts & planetary textures load. */
export function LoadingScreen({ progress, fontsReady }: { progress: number; fontsReady: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [spin, glow]);

  useEffect(() => {
    Animated.timing(bar, { toValue: progress, duration: 300, useNativeDriver: false }).start();
  }, [progress, bar]);

  const msg = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor(progress * MESSAGES.length))];
  const rings = [
    { d: 250, k: 1, dot: 7, color: '#5ee7ff' },
    { d: 180, k: 1.7, dot: 6, color: '#ffb347' },
    { d: 116, k: 2.8, dot: 5, color: '#7c8cff' },
  ];
  const font = (f: string) => (fontsReady ? { fontFamily: f } : null);

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#0b0f2e', '#04050d', '#020206']} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <View style={{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center' }}>
          {rings.map((r) => (
            <Animated.View
              key={r.d}
              style={{
                position: 'absolute',
                width: r.d,
                height: r.d,
                borderRadius: r.d / 2,
                borderWidth: 1,
                borderColor: 'rgba(170,180,255,0.18)',
                transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 * r.k}deg`] }) }],
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  top: -r.dot / 2,
                  left: r.d / 2 - r.dot / 2,
                  width: r.dot,
                  height: r.dot,
                  borderRadius: r.dot,
                  backgroundColor: r.color,
                  shadowColor: r.color,
                  shadowOpacity: 1,
                  shadowRadius: 6,
                }}
              />
            </Animated.View>
          ))}
          <Animated.View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
              transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }],
              shadowColor: '#ffb347',
              shadowOpacity: 0.9,
              shadowRadius: 30,
            }}
          >
            <LinearGradient colors={['#fff2c4', '#ffb347', '#ff6a00']} start={{ x: 0.3, y: 0.2 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1, borderRadius: 32 }} />
          </Animated.View>
        </View>

        <Text style={[styles.title, font('SpaceGrotesk_700Bold')]}>SOLARIS</Text>
        <Text style={[styles.subtitle, font('Inter_400Regular')]}>Solar System Explorer</Text>

        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={[styles.status, font('Inter_500Medium')]}>
          {msg}… {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { color: '#fff', fontSize: 34, letterSpacing: 12, marginTop: 24, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 2, marginTop: 6 },
  track: { width: 200, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 32, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#aab4ff' },
  status: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 12 },
});
