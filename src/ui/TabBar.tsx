import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass } from './Glass';

export type TabKey = 'explore' | 'ar' | 'discover';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'explore', label: 'Explore', icon: 'planet-outline', activeIcon: 'planet' },
  { key: 'ar', label: 'AR View', icon: 'scan-outline', activeIcon: 'scan' },
  { key: 'discover', label: 'Discover', icon: 'sparkles-outline', activeIcon: 'sparkles' },
];

export const TAB_BAR_HEIGHT = 64;

export function tap() {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
}

export function TabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom, 12) }}
      className="items-center px-4"
    >
      <Glass radius={28} style={{ width: '100%', maxWidth: 420 }}>
        <View className="flex-row p-1.5" style={{ height: TAB_BAR_HEIGHT }}>
          {TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={t.label}
                onPress={() => {
                  if (!isActive) {
                    tap();
                    onChange(t.key);
                  }
                }}
                className="flex-1 items-center justify-center rounded-3xl overflow-hidden"
              >
                {isActive && (
                  <LinearGradient
                    colors={['rgba(124,140,255,0.35)', 'rgba(94,231,255,0.18)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, borderRadius: 22 }}
                  />
                )}
                <Ionicons name={isActive ? t.activeIcon : t.icon} size={21} color={isActive ? '#ffffff' : 'rgba(255,255,255,0.55)'} />
                <Text
                  className={isActive ? 'font-body-semibold text-white' : 'font-body-medium text-white/55'}
                  style={{ fontSize: 11, marginTop: 3, letterSpacing: 0.3 }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}
