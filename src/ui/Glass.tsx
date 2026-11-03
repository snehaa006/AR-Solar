import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

/** Frosted glass surface used for all floating UI. */
export function Glass({
  children,
  style,
  intensity = 40,
  radius = 22,
  tint = 'rgba(12,16,34,0.55)',
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
  tint?: string;
}) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255,255,255,0.14)',
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint="dark"
        // Android blur in Expo Go is experimental; the tint layer keeps contrast either way.
        blurMethod="none"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'android' ? 'rgba(12,16,34,0.85)' : tint }]} />
      {children}
    </View>
  );
}
