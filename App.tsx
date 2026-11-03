import './global.css';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BodyId } from './src/data/planets';
import { ARScreen } from './src/screens/ARScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { preloadTextures } from './src/three/textures';
import { TabBar, TabKey } from './src/ui/TabBar';
import { createWorld } from './src/world';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  const fontsReady = fontsLoaded || !!fontError;
  const [progress, setProgress] = useState(0);
  const [texturesReady, setTexturesReady] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const splash = useRef(new Animated.Value(1)).current;

  const world = useRef(createWorld()).current;
  const [tab, setTab] = useState<TabKey>('explore');
  const [selectedId, setSelectedId] = useState<BodyId | null>(null);
  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    preloadTextures((p) => alive && setProgress(p)).then(() => {
      // Hold the splash briefly so the intro animation reads as intentional.
      const wait = Math.max(0, 900 - (Date.now() - started));
      setTimeout(() => alive && setTexturesReady(true), wait);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ready = fontsReady && texturesReady;
  useEffect(() => {
    if (!ready) return;
    Animated.timing(splash, { toValue: 0, duration: 900, delay: 250, useNativeDriver: true }).start(() => setSplashGone(true));
  }, [ready, splash]);

  const openExploreAt = useCallback((id: BodyId) => {
    setSelectedId(id);
    setTab('explore');
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <StatusBar style="light" />
        {ready && (
          <>
            {tab === 'explore' && (
              <ExploreScreen world={world} selectedId={selectedId} onSelect={setSelectedId} onOpenAR={() => setTab('ar')} />
            )}
            {tab === 'ar' && <ARScreen world={world} onImmersiveChange={setImmersive} onOpenExplore={() => setTab('explore')} />}
            {tab === 'discover' && <DiscoverScreen onExplore={openExploreAt} />}
            {!immersive && <TabBar active={tab} onChange={setTab} />}
          </>
        )}
        {!splashGone && (
          <Animated.View pointerEvents={ready ? 'none' : 'auto'} style={[StyleSheet.absoluteFill, { opacity: splash }]}>
            <LoadingScreen progress={progress} fontsReady={fontsReady} />
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#03040a' },
});
