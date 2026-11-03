import { Ionicons } from '@expo/vector-icons';
import { Canvas } from '@react-three/fiber';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ARMode, ARScene, createPlacement } from '../ar/ARScene';
import { createMotionSample, MotionHandle, startMotion } from '../ar/motion';
import { BodyId } from '../data/planets';
import { BodyRegistry, pickBody } from '../three/sim';
import { GestureLayer } from '../ui/GestureLayer';
import { Glass } from '../ui/Glass';
import { Labels } from '../ui/Labels';
import { PlanetOrb } from '../ui/PlanetOrb';
import { PlanetSheet, SheetMode } from '../ui/PlanetSheet';
import { TAB_BAR_HEIGHT, tap } from '../ui/TabBar';
import { stepBody, World } from '../world';

type Phase = 'intro' | 'starting' | 'running';

interface Props {
  world: World;
  onImmersiveChange: (immersive: boolean) => void;
  onOpenExplore: () => void;
}

function cameraLikelyAvailable() {
  if (Platform.OS !== 'web') return true;
  const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
  return !!(nav && nav.mediaDevices && nav.mediaDevices.getUserMedia && (window as any).isSecureContext);
}

export function ARScreen({ world, onImmersiveChange, onOpenExplore }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('intro');
  const [mode, setMode] = useState<ARMode>('gyro');
  const [notice, setNotice] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [selectedId, setSelectedId] = useState<BodyId | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>('hidden');
  const [paused, setPaused] = useState(false);

  const motion = useRef(createMotionSample()).current;
  const placement = useRef(createPlacement()).current;
  const registry = useRef<BodyRegistry>(new Map()).current;
  const motionHandle = useRef<MotionHandle | null>(null);
  const labels = useSharedValue<number[]>([]);
  const pinchStart = useRef(1);

  useEffect(() => {
    onImmersiveChange(phase === 'running');
  }, [phase, onImmersiveChange]);

  useEffect(
    () => () => {
      motionHandle.current?.stop();
      onImmersiveChange(false);
    },
    [onImmersiveChange],
  );

  const resetPlacement = useCallback(() => {
    placement.placed = false;
    placement.yaw = 0;
    placement.tilt = 0;
    placement.scale = 1;
    setPlaced(false);
  }, [placement]);

  const stop = useCallback(() => {
    motionHandle.current?.stop();
    motionHandle.current = null;
    motion.has = false;
    setSelectedId(null);
    setSheetMode('hidden');
    setPhase('intro');
  }, [motion]);

  const startTabletop = useCallback(
    (why: string | null) => {
      resetPlacement();
      placement.placed = true;
      placement.tilt = 0.12;
      setPlaced(true);
      setMode('tabletop');
      setNotice(why);
      setPhase('running');
    },
    [placement, resetPlacement],
  );

  const startAR = useCallback(async () => {
    tap();
    setPhase('starting');
    // Motion first: on iOS Safari the permission prompt must come straight from the tap.
    const handle = await startMotion(motion);
    if (!cameraLikelyAvailable()) {
      handle?.stop();
      startTabletop('Camera AR needs a phone camera over a secure (https) connection. Showing the 3D tabletop instead.');
      return;
    }
    let granted = permission?.granted ?? false;
    if (!granted) {
      try {
        const res = await requestPermission();
        granted = res.granted;
      } catch {
        granted = false;
      }
    }
    if (!granted) {
      handle?.stop();
      startTabletop('Camera access was denied, so AR is unavailable. Enjoy the 3D tabletop view — or allow camera access in Settings.');
      return;
    }
    motionHandle.current = handle;
    resetPlacement();
    if (!handle) {
      // Camera works but there is no gyroscope/attitude sensor: overlay with touch controls.
      placement.placed = true;
      setPlaced(true);
      setMode('touch');
      setNotice('Motion sensors unavailable — drag to spin the system instead of moving your phone.');
    } else {
      setMode('gyro');
      setNotice(null);
      // If no sensor data arrives shortly (desktop browsers, simulators) fall back to touch mode.
      setTimeout(() => {
        if (!motion.has && motionHandle.current === handle) {
          placement.placed = true;
          setPlaced(true);
          setMode('touch');
          setNotice('No motion data from this device — drag to spin, pinch to resize.');
        }
      }, 1500);
    }
    setPhase('running');
  }, [motion, permission, requestPermission, resetPlacement, placement, startTabletop]);

  const onTap = useCallback(
    (x: number, y: number) => {
      if (mode === 'gyro' && !placement.placed) {
        placement.placed = true;
        setPlaced(true);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return;
      }
      if (!placement.camera) return;
      const id = pickBody(registry, placement.camera, placement.size.width, placement.size.height, x, y, true);
      if (id) {
        tap();
        setSelectedId(id);
        setSheetMode((m) => (m === 'hidden' ? 'peek' : m));
      } else if (sheetMode !== 'hidden') {
        setSheetMode('hidden');
        setSelectedId(null);
      }
    },
    [mode, placement, registry, sheetMode],
  );

  /* ----------------------------------------------------------------------- */
  if (phase !== 'running') {
    return <ARIntro starting={phase === 'starting'} onStart={startAR} onTabletop={() => { tap(); startTabletop(null); }} onOpenExplore={onOpenExplore} />;
  }

  const showCamera = mode !== 'tabletop';
  const modeLabel = mode === 'gyro' ? 'AR · Motion tracking' : mode === 'touch' ? 'AR · Touch mode' : '3D Tabletop';

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black">
      {showCamera ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <LinearGradient colors={['#0b1030', '#05060f', '#020208']} style={StyleSheet.absoluteFill} />
      )}
      {/* Subtle vignette for legibility over the camera feed */}
      {showCamera && (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
          locations={[0, 0.22, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}

      <Canvas
        style={StyleSheet.absoluteFill as any}
        camera={{ fov: 62, near: 0.005, far: 60, position: [0, 0, 0] }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <ARScene mode={mode} motion={motion} placement={placement} sim={world.sim} registry={registry} selectedId={selectedId} labels={labels} />
      </Canvas>

      <GestureLayer
        style={StyleSheet.absoluteFill}
        onTap={onTap}
        onDrag={(dx, dy) => {
          placement.yaw += dx * 0.01;
          if (mode !== 'gyro') placement.tilt = Math.max(-0.35, Math.min(1.1, placement.tilt + dy * 0.005));
        }}
        onPinchStart={() => {
          pinchStart.current = placement.scale;
        }}
        onPinch={(s) => {
          placement.scale = Math.max(0.3, Math.min(6, pinchStart.current * s));
        }}
        onWheel={(dy) => {
          placement.scale = Math.max(0.3, Math.min(6, placement.scale * Math.exp(-dy * 0.0012)));
        }}
      />

      <Labels data={labels} selectedId={selectedId} visible={placed || mode !== 'gyro'} />

      {/* Reticle while previewing */}
      {mode === 'gyro' && !placed && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Reticle />
        </View>
      )}

      {/* Top bar */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 14, right: 14 }}>
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityLabel="Exit AR" onPress={() => { tap(); stop(); }} hitSlop={8}>
            <Glass radius={20}>
              <View className="w-10 h-10 items-center justify-center">
                <Ionicons name="close" size={20} color="#fff" />
              </View>
            </Glass>
          </Pressable>
          <Glass radius={16}>
            <View className="flex-row items-center px-3 py-2">
              <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: mode === 'gyro' ? '#4ade80' : '#fbbf24' }} />
              <Text className="font-body-semibold text-white" style={{ fontSize: 12 }}>
                {modeLabel}
              </Text>
            </View>
          </Glass>
          <View className="flex-row">
            <Pressable
              accessibilityLabel={paused ? 'Resume orbits' : 'Pause orbits'}
              onPress={() => {
                tap();
                world.sim.paused = !world.sim.paused;
                setPaused(world.sim.paused);
              }}
              hitSlop={6}
            >
              <Glass radius={20}>
                <View className="w-10 h-10 items-center justify-center">
                  <Ionicons name={paused ? 'play' : 'pause'} size={17} color="#fff" />
                </View>
              </Glass>
            </Pressable>
            {mode === 'gyro' && (
              <Pressable accessibilityLabel="Re-place solar system" onPress={() => { tap(); resetPlacement(); }} hitSlop={6} style={{ marginLeft: 8 }}>
                <Glass radius={20}>
                  <View className="w-10 h-10 items-center justify-center">
                    <Ionicons name="locate" size={18} color="#fff" />
                  </View>
                </Glass>
              </Pressable>
            )}
          </View>
        </View>
        {notice && (
          <Glass radius={16} style={{ marginTop: 10 }}>
            <View className="flex-row items-start px-3.5 py-3">
              <Ionicons name="information-circle" size={18} color="#fbbf24" />
              <Text className="flex-1 font-body text-white/85 ml-2" style={{ fontSize: 12.5, lineHeight: 18 }}>
                {notice}
              </Text>
              {permission && !permission.granted && !permission.canAskAgain && Platform.OS !== 'web' && (
                <Pressable onPress={() => Linking.openSettings()} className="ml-2">
                  <Text className="font-body-semibold" style={{ color: '#aab4ff', fontSize: 12.5 }}>
                    Settings
                  </Text>
                </Pressable>
              )}
              <Pressable onPress={() => setNotice(null)} hitSlop={8} className="ml-2">
                <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>
          </Glass>
        )}
      </View>

      {/* Bottom instruction */}
      {sheetMode === 'hidden' && (
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 22, alignItems: 'center' }}>
          <Glass radius={20}>
            <View className="flex-row items-center px-4 py-3">
              <Ionicons name={mode === 'gyro' && !placed ? 'scan-outline' : 'hand-left-outline'} size={16} color="#fff" />
              <Text className="font-body-medium text-white ml-2" style={{ fontSize: 13 }}>
                {mode === 'gyro' && !placed
                  ? 'Aim at an open space, then tap to place'
                  : mode === 'gyro'
                    ? 'Move your phone to look around · Pinch to resize · Tap a planet'
                    : 'Drag to rotate · Pinch to resize · Tap a planet'}
              </Text>
            </View>
          </Glass>
        </View>
      )}

      <PlanetSheet
        id={selectedId}
        mode={sheetMode}
        onModeChange={setSheetMode}
        onClose={() => {
          setSheetMode('hidden');
          setSelectedId(null);
        }}
        onPrev={() => selectedId && setSelectedId(stepBody(selectedId, -1))}
        onNext={() => selectedId && setSelectedId(stepBody(selectedId, 1))}
        noTabBar
      />
    </View>
  );
}

/* ------------------------------------------------------------------------- */

function Reticle() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center', transform: [{ rotate }] }}>
      <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1.5, borderColor: 'rgba(170,180,255,0.7)', borderStyle: 'dashed' }} />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' }} />
    </Animated.View>
  );
}

function ARIntro({ starting, onStart, onTabletop, onOpenExplore }: { starting: boolean; onStart: () => void; onTabletop: () => void; onOpenExplore: () => void }) {
  const insets = useSafeAreaInsets();
  const orbit = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [orbit]);

  const steps = [
    { icon: 'phone-portrait-outline' as const, title: 'Point at an open space', body: 'A desk, floor or the middle of the room works best.' },
    { icon: 'finger-print-outline' as const, title: 'Tap to place', body: 'The Solar System anchors in front of you.' },
    { icon: 'expand-outline' as const, title: 'Explore', body: 'Turn around it with your phone, pinch to resize, tap a planet for facts.' },
  ];

  return (
    <View style={StyleSheet.absoluteFill} className="bg-space-950">
      <LinearGradient colors={['#0d1238', '#060818', '#03040a']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40, paddingHorizontal: 22 }}>
        <Text className="font-display text-white/50" style={{ fontSize: 12, letterSpacing: 5 }}>
          AUGMENTED REALITY
        </Text>
        <Text className="font-display text-white mt-1" style={{ fontSize: 34, lineHeight: 38 }}>
          The Solar System,{'\n'}in your room.
        </Text>

        {/* Hero */}
        <View className="items-center justify-center my-6" style={{ height: 230 }}>
          {[220, 160, 100].map((d, i) => (
            <Animated.View
              key={d}
              style={{
                position: 'absolute',
                width: d,
                height: d * 0.42,
                borderRadius: d,
                borderWidth: 1,
                borderColor: `rgba(140,155,255,${0.22 + i * 0.12})`,
              }}
            />
          ))}
          {[
            { d: 220, id: 'saturn' as const, size: 26, k: 1, phase: 0.1 },
            { d: 160, id: 'earth' as const, size: 20, k: 2, phase: 0.55 },
            { d: 100, id: 'mars' as const, size: 14, k: 3, phase: 0.8 },
          ].map((p) => {
            // Sample an ellipse so the orb travels along the tilted orbit drawn above.
            const N = 48;
            const input = Array.from({ length: N + 1 }, (_, i) => i / N);
            const angle = (t: number) => (t * p.k + p.phase) * Math.PI * 2;
            const tx = orbit.interpolate({ inputRange: input, outputRange: input.map((t) => (Math.cos(angle(t)) * p.d) / 2) });
            const ty = orbit.interpolate({ inputRange: input, outputRange: input.map((t) => (Math.sin(angle(t)) * p.d * 0.42) / 2) });
            return (
              <Animated.View key={p.id} style={{ position: 'absolute', transform: [{ translateX: tx }, { translateY: ty }] }}>
                <PlanetOrb id={p.id} size={p.size} />
              </Animated.View>
            );
          })}
          <PlanetOrb id="sun" size={56} glow />
        </View>

        <Glass radius={24}>
          <View className="p-4">
            {steps.map((s, i) => (
              <View key={s.title} className="flex-row items-start" style={{ marginBottom: i < steps.length - 1 ? 14 : 0 }}>
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(124,140,255,0.18)' }}>
                  <Ionicons name={s.icon} size={18} color="#aab4ff" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-white" style={{ fontSize: 14.5 }}>
                    {s.title}
                  </Text>
                  <Text className="font-body text-white/55 mt-0.5" style={{ fontSize: 12.5, lineHeight: 18 }}>
                    {s.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Glass>

        <Pressable disabled={starting} onPress={onStart} className="mt-5 rounded-2xl overflow-hidden" accessibilityLabel="Start AR">
          <LinearGradient colors={['#7c8cff', '#5ee7ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
            {starting ? <ActivityIndicator color="#060815" /> : <Ionicons name="scan" size={19} color="#060815" />}
            <Text className="font-body-semibold ml-2" style={{ color: '#060815', fontSize: 16 }}>
              {starting ? 'Starting camera…' : 'Start AR'}
            </Text>
          </LinearGradient>
        </Pressable>
        <View className="flex-row mt-3">
          <Pressable onPress={onTabletop} className="flex-1 rounded-2xl py-3.5 items-center mr-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Text className="font-body-semibold text-white" style={{ fontSize: 13.5 }}>
              3D Tabletop
            </Text>
          </Pressable>
          <Pressable onPress={onOpenExplore} className="flex-1 rounded-2xl py-3.5 items-center ml-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Text className="font-body-semibold text-white" style={{ fontSize: 13.5 }}>
              Space Explorer
            </Text>
          </Pressable>
        </View>
        <Text className="font-body text-white/35 mt-5" style={{ fontSize: 11.5, lineHeight: 17 }}>
          SOLARIS AR uses your camera and motion sensors (gyroscope) to anchor the Solar System around you — it runs directly
          in Expo Go on iPhone and Android. If the camera or sensors aren’t available, it automatically switches to touch
          controls or the 3D tabletop.
        </Text>
      </ScrollView>
    </View>
  );
}
