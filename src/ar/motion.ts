import { DeviceMotion } from 'expo-sensors';
import { Platform } from 'react-native';
import * as THREE from 'three';

/** Latest device attitude in radians (W3C DeviceOrientation convention). */
export interface MotionSample {
  alpha: number;
  beta: number;
  gamma: number;
  has: boolean;
}

export function createMotionSample(): MotionSample {
  return { alpha: 0, beta: 0, gamma: 0, has: false };
}

export interface MotionHandle {
  stop: () => void;
}

/**
 * Starts streaming device orientation into `sample`.
 * Must be called from a user gesture on the web (iOS Safari permission prompt).
 */
export async function startMotion(sample: MotionSample): Promise<MotionHandle | null> {
  if (Platform.OS === 'web') {
    const DOE: any = typeof window !== 'undefined' ? (window as any).DeviceOrientationEvent : undefined;
    if (!DOE) return null;
    if (typeof DOE.requestPermission === 'function') {
      try {
        const res = await DOE.requestPermission();
        if (res !== 'granted') return null;
      } catch {
        return null;
      }
    }
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha == null || e.beta == null || e.gamma == null) return;
      sample.alpha = THREE.MathUtils.degToRad(e.alpha);
      sample.beta = THREE.MathUtils.degToRad(e.beta);
      sample.gamma = THREE.MathUtils.degToRad(e.gamma);
      sample.has = true;
    };
    window.addEventListener('deviceorientation', onOrient);
    return { stop: () => window.removeEventListener('deviceorientation', onOrient) };
  }

  try {
    const available = await DeviceMotion.isAvailableAsync();
    if (!available) return null;
    const perm = await DeviceMotion.requestPermissionsAsync();
    if (perm.status !== 'granted') return null;
  } catch {
    return null;
  }
  DeviceMotion.setUpdateInterval(16);
  const sub = DeviceMotion.addListener((d) => {
    if (!d.rotation) return;
    sample.alpha = d.rotation.alpha;
    sample.beta = d.rotation.beta;
    sample.gamma = d.rotation.gamma;
    sample.has = true;
  });
  return { stop: () => sub.remove() };
}

const zee = new THREE.Vector3(0, 0, 1);
const euler = new THREE.Euler();
const q0 = new THREE.Quaternion();
const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // −90° about X: camera looks out of the back of the device

/** Device attitude → camera quaternion (portrait). */
export function motionToQuaternion(s: MotionSample, out: THREE.Quaternion, screenOrientation = 0) {
  euler.set(s.beta, s.alpha, -s.gamma, 'YXZ');
  out.setFromEuler(euler);
  out.multiply(q1);
  out.multiply(q0.setFromAxisAngle(zee, -screenOrientation));
  return out;
}
