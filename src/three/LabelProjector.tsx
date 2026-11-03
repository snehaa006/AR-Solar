import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import * as THREE from 'three';
import { ALL_BODIES } from '../data/planets';
import { BodyRegistry, projectBody } from './sim';

/** Number of floats written per body: x, y, opacity, radiusPx */
export const LABEL_STRIDE = 4;

/**
 * Projects every registered body to screen space and publishes the result to a
 * Reanimated shared value so RN overlay labels can follow planets without
 * re-rendering React.
 */
export function LabelProjector({ registry, out }: { registry: BodyRegistry; out: SharedValue<number[]> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const frame = useRef(0);

  useFrame(() => {
    frame.current++;
    if (frame.current % 2) return; // ~30 Hz is plenty for labels
    const next: number[] = new Array(ALL_BODIES.length * LABEL_STRIDE).fill(0);
    ALL_BODIES.forEach((b, i) => {
      const obj = registry.get(b.id);
      if (!obj) return;
      const p = projectBody(obj, camera, size.width, size.height);
      // Fade labels that are off-screen or that would overlap the body itself when very close.
      const opacity = p.visible ? THREE.MathUtils.clamp(1 - (p.radiusPx - 60) / 80, 0, 1) : 0;
      next[i * LABEL_STRIDE] = p.x;
      next[i * LABEL_STRIDE + 1] = p.y;
      next[i * LABEL_STRIDE + 2] = opacity;
      next[i * LABEL_STRIDE + 3] = p.radiusPx;
    });
    out.value = next;
  });

  return null;
}
