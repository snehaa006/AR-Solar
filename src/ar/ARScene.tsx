import { useFrame, useThree } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';
import type { SharedValue } from 'react-native-reanimated';
import { BodyId } from '../data/planets';
import { LabelProjector } from '../three/LabelProjector';
import { getHaloRingTexture } from '../three/procedural';
import { BodyRegistry, SimState } from '../three/sim';
import { SimClock, SolarSystem } from '../three/SolarSystem';
import { MotionSample, motionToQuaternion } from './motion';

export type ARMode = 'gyro' | 'touch' | 'tabletop';

/** Base scale: Neptune's orbit (46 units) ≈ 0.5 m radius. */
export const AR_BASE_SCALE = 0.011;

export interface Placement {
  placed: boolean;
  yaw: number;
  tilt: number;
  scale: number;
  distance: number;
  camera: THREE.PerspectiveCamera | null;
  size: { width: number; height: number };
}

export function createPlacement(): Placement {
  return { placed: false, yaw: 0, tilt: 0, scale: 1, distance: 1.35, camera: null, size: { width: 1, height: 1 } };
}

const tmpQ = new THREE.Quaternion();
const forward = new THREE.Vector3();
const desired = new THREE.Vector3();
const TABLETOP_CAM = new THREE.Vector3(0, 0.58, 1.22);
const TABLETOP_LOOK = new THREE.Vector3(0, -0.04, 0);

function Rig({ mode, motion, placement, groupRef, ringRef }: {
  mode: ARMode;
  motion: MotionSample;
  placement: Placement;
  groupRef: React.RefObject<THREE.Group | null>;
  ringRef: React.RefObject<THREE.Mesh | null>;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    placement.camera = camera;
    placement.size = size;
    const g = groupRef.current;
    if (!g) return;

    if (mode === 'gyro') {
      camera.position.set(0, 0, 0);
      if (motion.has) {
        motionToQuaternion(motion, tmpQ);
        camera.quaternion.slerp(tmpQ, 1 - Math.exp(-dt * 24));
      }
      if (!placement.placed) {
        // Preview: the system floats in front of the camera until the user taps.
        forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
        desired.copy(forward).multiplyScalar(placement.distance);
        desired.y -= 0.12;
        g.position.lerp(desired, 1 - Math.exp(-dt * 8));
      }
    } else if (mode === 'touch') {
      camera.position.set(0, 0, 0);
      camera.quaternion.identity();
      desired.set(0, -0.16, -placement.distance);
      g.position.lerp(desired, 1 - Math.exp(-dt * 8));
    } else {
      camera.position.copy(TABLETOP_CAM);
      camera.lookAt(TABLETOP_LOOK);
      g.position.set(0, 0, 0);
    }

    const k = 1 - Math.exp(-dt * 10);
    g.rotation.y += (placement.yaw - g.rotation.y) * k;
    g.rotation.x += (placement.tilt - g.rotation.x) * k;
    const s = AR_BASE_SCALE * placement.scale;
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * k);

    const ring = ringRef.current;
    if (ring) {
      const mat = ring.material as THREE.MeshBasicMaterial;
      const pulse = placement.placed || mode !== 'gyro' ? 0.55 : 0.55 + Math.sin(state.clock.elapsedTime * 4) * 0.35;
      mat.opacity = pulse;
    }
  });
  return null;
}

export function ARScene({ mode, motion, placement, sim, registry, selectedId, labels }: {
  mode: ARMode;
  motion: MotionSample;
  placement: Placement;
  sim: SimState;
  registry: BodyRegistry;
  selectedId: BodyId | null;
  labels: SharedValue<number[]>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  return (
    <>
      <SimClock sim={sim} />
      <Rig mode={mode} motion={motion} placement={placement} groupRef={groupRef} ringRef={ringRef} />
      <group ref={groupRef} scale={AR_BASE_SCALE} position={[0, -0.12, -1.35]}>
        <SolarSystem sim={sim} registry={registry} selectedId={selectedId} lite />
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
          <planeGeometry args={[110, 110]} />
          <meshBasicMaterial
            map={getHaloRingTexture()}
            color="#7c8cff"
            transparent
            opacity={0.55}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      <LabelProjector registry={registry} out={labels} />
    </>
  );
}
