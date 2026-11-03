import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BODY_BY_ID, BodyData, BodyId, formatNumber } from '../data/planets';
import { Glass } from './Glass';
import { PlanetOrb } from './PlanetOrb';
import { TAB_BAR_HEIGHT, tap } from './TabBar';

export type SheetMode = 'hidden' | 'peek' | 'full';

interface Stat {
  label: string;
  value: string;
  sub?: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function bodyStats(b: BodyData): Stat[] {
  const stats: Stat[] = [
    { label: 'Diameter', value: `${formatNumber(b.diameterKm)} km`, sub: `${(b.diameterKm / 12756).toFixed(2)}× Earth`, icon: 'resize-outline' },
  ];
  if (b.id === 'sun') {
    stats.push(
      { label: 'Surface temp', value: '5,500 °C', sub: 'Core ≈ 15 million °C', icon: 'thermometer-outline' },
      { label: 'Rotation', value: b.dayLabel, sub: 'Differential rotation', icon: 'sync-outline' },
      { label: 'Galactic year', value: '~230 Myr', sub: 'Orbit of the Milky Way', icon: 'planet-outline' },
      { label: 'Mass', value: '333,000×', sub: 'Earth masses', icon: 'barbell-outline' },
      { label: 'Gravity', value: `${b.gravity} m/s²`, sub: `${(b.gravity / 9.8).toFixed(1)}× Earth`, icon: 'arrow-down-outline' },
    );
    return stats;
  }
  stats.push(
    { label: 'From the Sun', value: `${formatNumber(b.distanceMKm, 1)}M km`, sub: `${b.distanceAU} AU`, icon: 'navigate-outline' },
    { label: 'Moons', value: `${b.moons}`, sub: b.moons === 0 ? 'None known' : 'Confirmed', icon: 'moon-outline' },
    { label: 'Day length', value: b.dayLabel, sub: 'Solar day', icon: 'sunny-outline' },
    { label: 'Year length', value: b.yearLabel, sub: `${b.orbitalVelocityKmS} km/s orbit`, icon: 'sync-outline' },
    { label: 'Gravity', value: `${b.gravity} m/s²`, sub: `${(b.gravity / 9.8).toFixed(2)}× Earth`, icon: 'arrow-down-outline' },
    { label: 'Mean temp', value: `${formatNumber(b.meanTempC)} °C`, sub: b.type, icon: 'thermometer-outline' },
    { label: 'Mass', value: `${formatNumber(b.massE24Kg / 5.97, b.massE24Kg < 5.97 ? 3 : 1)}×`, sub: 'Earth masses', icon: 'barbell-outline' },
    { label: 'Axial tilt', value: `${b.axialTiltDeg}°`, sub: b.axialTiltDeg > 90 ? 'Retrograde spin' : 'Obliquity', icon: 'compass-outline' },
  );
  return stats;
}

function StatCard({ s, accent }: { s: Stat; accent: string }) {
  return (
    <View className="rounded-2xl p-3 mb-2.5" style={{ width: '48.5%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' }}>
      <View className="flex-row items-center mb-1.5">
        <Ionicons name={s.icon} size={13} color={accent} />
        <Text className="font-body-medium text-white/55 ml-1.5 uppercase" style={{ fontSize: 10, letterSpacing: 1 }}>
          {s.label}
        </Text>
      </View>
      <Text className="font-display text-white" style={{ fontSize: 17 }} numberOfLines={1} adjustsFontSizeToFit>
        {s.value}
      </Text>
      {s.sub ? (
        <Text className="font-body text-white/45 mt-0.5" style={{ fontSize: 11 }} numberOfLines={1}>
          {s.sub}
        </Text>
      ) : null}
    </View>
  );
}

export interface PlanetSheetProps {
  id: BodyId | null;
  mode: SheetMode;
  onModeChange: (m: SheetMode) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenAR?: () => void;
  /** Hide the bottom tab bar spacing (AR screen has no tab bar). */
  noTabBar?: boolean;
}

export function PlanetSheet({ id, mode, onModeChange, onClose, onPrev, onNext, onOpenAR, noTabBar }: PlanetSheetProps) {
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomSpace = noTabBar ? insets.bottom + 12 : TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 12;
  const fullH = Math.min(screenH * 0.66, 660);
  const peekH = 176 + bottomSpace;

  const lastId = useRef<BodyId | null>(id);
  if (id) lastId.current = id;
  const body = lastId.current ? BODY_BY_ID[lastId.current] : null;

  const targetY = mode === 'full' ? 0 : mode === 'peek' ? fullH - peekH : fullH + 30;
  const y = useRef(new Animated.Value(fullH + 30)).current;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    Animated.spring(y, { toValue: targetY, useNativeDriver: true, damping: 22, stiffness: 190, mass: 0.9 }).start();
  }, [targetY, y]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
        onPanResponderRelease: (_, g) => {
          const m = modeRef.current;
          if (Math.abs(g.dy) < 6) {
            onModeChange(m === 'full' ? 'peek' : 'full');
            return;
          }
          if (g.dy < -30 || g.vy < -0.4) onModeChange('full');
          else if (g.dy > 30 || g.vy > 0.4) {
            if (m === 'full') onModeChange('peek');
            else onClose();
          }
        },
      }),
    [onModeChange, onClose],
  );

  if (!body) return null;
  const stats = bodyStats(body);

  return (
    <Animated.View
      pointerEvents={mode === 'hidden' ? 'none' : 'box-none'}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fullH, transform: [{ translateY: y }] }}
    >
      <Glass radius={30} intensity={55} tint="rgba(8,11,26,0.72)" style={{ flex: 1, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <LinearGradient
          colors={[body.color + '33', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 0.5 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
        />
        {/* Header (drag handle) */}
        <View {...pan.panHandlers} className="px-5 pt-2.5 pb-3">
          <View className="self-center rounded-full mb-3" style={{ width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          <View className="flex-row items-center">
            <PlanetOrb id={body.id} size={58} glow />
            <View className="flex-1 ml-4">
              <Text className="font-body-medium uppercase" style={{ color: body.color, fontSize: 11, letterSpacing: 1.6 }}>
                {body.type}
              </Text>
              <Text className="font-display text-white" style={{ fontSize: 30, lineHeight: 34 }}>
                {body.name}
              </Text>
              <Text className="font-body text-white/60" style={{ fontSize: 13 }} numberOfLines={1}>
                {body.tagline}
              </Text>
            </View>
            <Pressable accessibilityLabel="Close" onPress={() => { tap(); onClose(); }} hitSlop={10} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Quick nav + key numbers (visible in peek) */}
        <View className="flex-row items-center px-5 mb-3">
          <Pressable accessibilityLabel="Previous body" onPress={() => { tap(); onPrev(); }} hitSlop={8} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>
          <View className="flex-1 flex-row justify-around">
            {stats.slice(0, 3).map((s) => (
              <View key={s.label} className="items-center px-1">
                <Text className="font-display text-white" style={{ fontSize: 15 }} numberOfLines={1}>
                  {s.value}
                </Text>
                <Text className="font-body text-white/45 uppercase" style={{ fontSize: 9.5, letterSpacing: 0.8 }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
          <Pressable accessibilityLabel="Next body" onPress={() => { tap(); onNext(); }} hitSlop={8} className="w-9 h-9 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: bottomSpace + 12 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={mode === 'full'}
        >
          <Text className="font-body text-white/80 mb-4" style={{ fontSize: 14.5, lineHeight: 22 }}>
            {body.description}
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {stats.map((s) => (
              <StatCard key={s.label} s={s} accent={body.color} />
            ))}
          </View>

          <Text className="font-display text-white mt-3 mb-2" style={{ fontSize: 18 }}>
            Did you know?
          </Text>
          {body.facts.map((f, i) => (
            <View key={i} className="flex-row mb-2.5 rounded-2xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <View className="w-6 h-6 rounded-full items-center justify-center mr-3" style={{ backgroundColor: body.color + '30' }}>
                <Ionicons name="sparkles" size={12} color={body.color} />
              </View>
              <Text className="flex-1 font-body text-white/80" style={{ fontSize: 13.5, lineHeight: 20 }}>
                {f}
              </Text>
            </View>
          ))}

          {onOpenAR && (
            <Pressable onPress={() => { tap(); onOpenAR(); }} className="mt-3 rounded-2xl overflow-hidden">
              <LinearGradient colors={['#7c8cff', '#5ee7ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <Ionicons name="scan" size={18} color="#060815" />
                <Text className="font-body-semibold ml-2" style={{ color: '#060815', fontSize: 15 }}>
                  View the Solar System in AR
                </Text>
              </LinearGradient>
            </Pressable>
          )}
          <Text className="font-body text-white/30 text-center mt-4" style={{ fontSize: 10.5 }}>
            Data: NASA Planetary Fact Sheet · Sizes & distances in 3D are compressed for viewing
          </Text>
        </ScrollView>
      </Glass>
    </Animated.View>
  );
}
