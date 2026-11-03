import Ionicons from '@expo/vector-icons/Ionicons';
import { Canvas } from '@react-three/fiber';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_BODIES, BodyId } from '../data/planets';
import { CameraRig, setFocus } from '../three/CameraRig';
import { LabelProjector } from '../three/LabelProjector';
import { SimClock, SolarSystem, SpaceBackdrop } from '../three/SolarSystem';
import { pickBody } from '../three/sim';
import { GestureLayer } from '../ui/GestureLayer';
import { Glass } from '../ui/Glass';
import { Labels } from '../ui/Labels';
import { PlanetOrb } from '../ui/PlanetOrb';
import { PlanetSheet, SheetMode } from '../ui/PlanetSheet';
import { TAB_BAR_HEIGHT, tap } from '../ui/TabBar';
import { formatSimDate, SPEEDS, stepBody, World } from '../world';

interface Props {
  world: World;
  selectedId: BodyId | null;
  onSelect: (id: BodyId | null) => void;
  onOpenAR: () => void;
}

const SHEET_OFFSET: Record<SheetMode, number> = { hidden: 0, peek: 0.12, full: 0.26 };

export function ExploreScreen({ world, selectedId, onSelect, onOpenAR }: Props) {
  const insets = useSafeAreaInsets();
  const { sim, control, registry } = world;
  const [sheetMode, setSheetMode] = useState<SheetMode>(selectedId ? 'peek' : 'hidden');
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [speedIdx, setSpeedIdx] = useState(() => Math.max(0, SPEEDS.findIndex((s) => s.dps === sim.daysPerSecond)));
  const [paused, setPaused] = useState(sim.paused);
  const [dateLabel, setDateLabel] = useState(formatSimDate(sim.timeMs));
  const labelData = useSharedValue<number[]>([]);
  const pinchStart = useRef(0);
  const hint = useRef(new Animated.Value(0)).current;

  // Keep camera focus in sync with selection.
  useEffect(() => {
    setFocus(control, selectedId);
    setSheetMode((m) => (selectedId ? (m === 'hidden' ? 'peek' : m) : 'hidden'));
  }, [selectedId, control]);

  useEffect(() => {
    control.tOffsetY = SHEET_OFFSET[sheetMode];
  }, [sheetMode, control]);

  // Ticking date readout.
  useEffect(() => {
    const t = setInterval(() => setDateLabel(formatSimDate(sim.timeMs)), 250);
    return () => clearInterval(t);
  }, [sim]);

  // Gesture hint
  useEffect(() => {
    Animated.sequence([
      Animated.delay(1600),
      Animated.timing(hint, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.delay(4200),
      Animated.timing(hint, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, [hint]);

  const select = useCallback(
    (id: BodyId | null) => {
      if (id) tap();
      onSelect(id);
    },
    [onSelect],
  );

  const onTap = useCallback(
    (x: number, y: number) => {
      if (!control.camera) return;
      const id = pickBody(registry, control.camera, control.size.width, control.size.height, x, y, showLabels);
      if (id) select(id);
      else if (sheetMode === 'full') setSheetMode('peek');
    },
    [control, registry, select, showLabels, sheetMode],
  );

  const speed = SPEEDS[speedIdx];
  const isToday = Math.abs(sim.timeMs - Date.now()) < 86_400_000 * 120;

  return (
    <View style={StyleSheet.absoluteFill} className="bg-space-950">
      <Canvas
        style={StyleSheet.absoluteFill as any}
        camera={{ fov: 55, near: 0.1, far: 4000, position: [0, 120, 260] }}
        gl={{ antialias: true }}
        events={undefined}
      >
        <SimClock sim={sim} />
        <SpaceBackdrop />
        <SolarSystem sim={sim} registry={registry} selectedId={selectedId} showOrbits={showOrbits} />
        <CameraRig control={control} sim={sim} />
        <LabelProjector registry={registry} out={labelData} />
      </Canvas>

      <GestureLayer
        style={StyleSheet.absoluteFill}
        onTap={onTap}
        onDragStart={() => {
          control.dragging = true;
          control.vAz = 0;
          control.vPolar = 0;
          control.autoRotate = false;
        }}
        onDrag={(dx, dy) => {
          control.tAz -= dx * 0.0065;
          control.tPolar -= dy * 0.005;
        }}
        onDragEnd={(vx, vy) => {
          control.dragging = false;
          control.vAz = -vx * 1000 * 0.0065 * 0.3;
          control.vPolar = -vy * 1000 * 0.005 * 0.3;
        }}
        onPinchStart={() => {
          pinchStart.current = control.tDist;
        }}
        onPinch={(s) => {
          control.tDist = pinchStart.current / Math.max(s, 0.05);
        }}
        onWheel={(dy) => {
          control.tDist *= Math.exp(dy * 0.0012);
        }}
      />

      <Labels data={labelData} selectedId={selectedId} visible={showLabels} />

      {/* Top bar */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16 }}>
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-display text-white" style={{ fontSize: 13, letterSpacing: 6 }}>
              SOLARIS
            </Text>
            <Text className="font-display-medium text-white/90 mt-1" style={{ fontSize: 22 }}>
              {dateLabel}
            </Text>
            <Text className="font-body text-white/45" style={{ fontSize: 11.5 }}>
              {paused ? 'Time paused' : `Simulating ${speed.label}`} · real planet positions
            </Text>
          </View>
          <Glass radius={20} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View className="flex-row items-center p-1">
              <Pressable
                accessibilityLabel={paused ? 'Play' : 'Pause'}
                onPress={() => {
                  tap();
                  sim.paused = !sim.paused;
                  setPaused(sim.paused);
                }}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <Ionicons name={paused ? 'play' : 'pause'} size={16} color="#fff" />
              </Pressable>
              <Pressable
                accessibilityLabel="Change simulation speed"
                onPress={() => {
                  tap();
                  const n = (speedIdx + 1) % SPEEDS.length;
                  setSpeedIdx(n);
                  sim.daysPerSecond = SPEEDS[n].dps;
                  sim.paused = false;
                  setPaused(false);
                }}
                className="h-9 px-3 ml-1 rounded-full items-center justify-center flex-row"
              >
                <Ionicons name="speedometer-outline" size={14} color="#aab4ff" />
                <Text className="font-body-semibold text-white ml-1.5" style={{ fontSize: 12 }}>
                  {speed.label}
                </Text>
              </Pressable>
            </View>
          </Glass>
        </View>
        {!isToday && (
          <Pressable
            onPress={() => {
              tap();
              sim.timeMs = Date.now();
              setDateLabel(formatSimDate(sim.timeMs));
            }}
            className="self-start mt-2 flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'rgba(124,140,255,0.18)', borderWidth: 1, borderColor: 'rgba(124,140,255,0.35)' }}
          >
            <Ionicons name="refresh" size={12} color="#cfd5ff" />
            <Text className="font-body-medium ml-1.5" style={{ color: '#cfd5ff', fontSize: 11.5 }}>
              Back to today
            </Text>
          </Pressable>
        )}
      </View>

      {/* Side controls */}
      <View pointerEvents="box-none" style={{ position: 'absolute', right: 14, top: insets.top + 118 }}>
        <Glass radius={22}>
          <View className="p-1">
            {[
              { icon: 'ellipse-outline' as const, on: showOrbits, label: 'Toggle orbits', act: () => setShowOrbits((v) => !v) },
              { icon: 'pricetag-outline' as const, on: showLabels, label: 'Toggle labels', act: () => setShowLabels((v) => !v) },
              { icon: 'contract-outline' as const, on: false, label: 'Overview', act: () => select(null) },
            ].map((b) => (
              <Pressable
                key={b.label}
                accessibilityLabel={b.label}
                onPress={() => {
                  tap();
                  b.act();
                }}
                className="w-10 h-10 rounded-full items-center justify-center my-0.5"
                style={{ backgroundColor: b.on ? 'rgba(124,140,255,0.28)' : 'transparent' }}
              >
                <Ionicons name={b.icon} size={18} color={b.on ? '#ffffff' : 'rgba(255,255,255,0.7)'} />
              </Pressable>
            ))}
          </View>
        </Glass>
      </View>

      {/* Gesture hint */}
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', alignSelf: 'center', top: '42%', opacity: hint }}
      >
        <Glass radius={18}>
          <View className="flex-row items-center px-4 py-2.5">
            <Ionicons name="hand-left-outline" size={15} color="#fff" />
            <Text className="font-body-medium text-white ml-2" style={{ fontSize: 12.5 }}>
              Drag to orbit · Pinch to zoom · Tap a planet
            </Text>
          </View>
        </Glass>
      </Animated.View>

      {/* Planet carousel */}
      {sheetMode === 'hidden' && (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 14 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14 }}>
            {ALL_BODIES.map((b) => (
              <Pressable
                key={b.id}
                accessibilityLabel={`Fly to ${b.name}`}
                onPress={() => select(b.id)}
                className="items-center mx-1.5 rounded-2xl px-2.5 py-2"
                style={{ backgroundColor: 'rgba(10,13,28,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', minWidth: 66 }}
              >
                <PlanetOrb id={b.id} size={34} />
                <Text className="font-body-medium text-white/85 mt-1.5" style={{ fontSize: 11 }}>
                  {b.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <PlanetSheet
        id={selectedId}
        mode={sheetMode}
        onModeChange={setSheetMode}
        onClose={() => select(null)}
        onPrev={() => selectedId && select(stepBody(selectedId, -1))}
        onNext={() => selectedId && select(stepBody(selectedId, 1))}
        onOpenAR={onOpenAR}
      />
    </View>
  );
}
