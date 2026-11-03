// Importing fiber first guarantees that, on iOS/Android, R3F's native polyfills
// (expo-asset backed THREE.TextureLoader) are installed before we load anything.
import '@react-three/fiber';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import * as THREE from 'three';

const SOURCES = {
  sun: require('../../assets/textures/sun.jpg'),
  mercury: require('../../assets/textures/mercury.jpg'),
  venus: require('../../assets/textures/venus.jpg'),
  earth: require('../../assets/textures/earth.jpg'),
  earthClouds: require('../../assets/textures/earth_clouds.jpg'),
  mars: require('../../assets/textures/mars.jpg'),
  jupiter: require('../../assets/textures/jupiter.jpg'),
  saturn: require('../../assets/textures/saturn.jpg'),
  saturnRing: require('../../assets/textures/saturn_ring.png'),
  uranus: require('../../assets/textures/uranus.jpg'),
  neptune: require('../../assets/textures/neptune.jpg'),
  moon: require('../../assets/textures/moon.jpg'),
  milkyWay: require('../../assets/textures/milky_way.jpg'),
} as const;

export type TextureKey = keyof typeof SOURCES;

/** Textures that hold data rather than colour. */
const LINEAR_KEYS: TextureKey[] = ['earthClouds'];

const cache = new Map<TextureKey, THREE.Texture>();
let loadingPromise: Promise<void> | null = null;

function loadOne(key: TextureKey): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const mod = SOURCES[key];
    // On web expo-asset gives us a URL; on native R3F's patched loader accepts the module id.
    const url: any = Platform.OS === 'web' ? Asset.fromModule(mod).uri : mod;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = LINEAR_KEYS.includes(key) ? THREE.NoColorSpace : THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        cache.set(key, tex);
        resolve(tex);
      },
      undefined,
      (err) => reject(err),
    );
  });
}

/**
 * Loads every texture once and keeps it cached for all scenes (3D + AR).
 * Individual failures are tolerated: the planet falls back to its flat colour.
 */
export function preloadTextures(onProgress?: (progress: number) => void): Promise<void> {
  if (loadingPromise) {
    onProgress?.(1);
    return loadingPromise;
  }
  const keys = Object.keys(SOURCES) as TextureKey[];
  let done = 0;
  loadingPromise = Promise.all(
    keys.map((k) =>
      loadOne(k)
        .catch((e) => {
          console.warn(`[SOLARIS] texture "${k}" failed to load`, e);
        })
        .finally(() => {
          done += 1;
          onProgress?.(done / keys.length);
        }),
    ),
  ).then(() => undefined);
  return loadingPromise;
}

export function getTexture(key: TextureKey): THREE.Texture | null {
  return cache.get(key) ?? null;
}
