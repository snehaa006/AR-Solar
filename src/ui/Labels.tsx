import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { ALL_BODIES, BodyData, BodyId } from '../data/planets';
import { LABEL_STRIDE } from '../three/LabelProjector';

const LABEL_W = 110;

function Label({ body, index, data, selected }: { body: BodyData; index: number; data: SharedValue<number[]>; selected: boolean }) {
  const style = useAnimatedStyle(() => {
    const d = data.value;
    const o = index * LABEL_STRIDE;
    const x = d[o] ?? 0;
    const y = d[o + 1] ?? 0;
    const opacity = d[o + 2] ?? 0;
    const r = d[o + 3] ?? 0;
    return {
      opacity,
      transform: [{ translateX: x - LABEL_W / 2 }, { translateY: y + r + 6 }],
    };
  });
  return (
    <Animated.View style={[styles.label, style]}>
      <View style={[styles.pill, selected && { borderColor: body.color, backgroundColor: 'rgba(10,14,30,0.75)' }]}>
        <View style={[styles.dot, { backgroundColor: body.color }]} />
        <Text style={[styles.text, selected && { color: '#fff' }]}>{body.name.toUpperCase()}</Text>
      </View>
    </Animated.View>
  );
}

export function Labels({ data, selectedId, visible }: { data: SharedValue<number[]>; selectedId: BodyId | null; visible: boolean }) {
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {ALL_BODIES.map((b, i) => (
        <Label key={b.id} body={b} index={i} data={data} selected={selectedId === b.id} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', left: 0, top: 0, width: LABEL_W, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.0)',
    backgroundColor: 'rgba(6,8,20,0.35)',
  },
  dot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
  text: { color: 'rgba(255,255,255,0.78)', fontSize: 9.5, letterSpacing: 1.4, fontFamily: 'Inter_600SemiBold' },
});
