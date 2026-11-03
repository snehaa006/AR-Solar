import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BODY_BY_ID, BodyId } from '../data/planets';
import { SimState, bodyLocalPosition } from './sim';

/**
 * Mutable orbit-camera controller. UI gestures write the `t*` targets / velocities
 * and the rig eases the actual camera towards them every frame.
 */
export interface OrbitControl {
  az: number;
  polar: number;
  dist: number;
  tAz: number;
  tPolar: number;
  tDist: number;
  vAz: number;
  vPolar: number;
  dragging: boolean;
  focus: BodyId | null;
  target: THREE.Vector3;
  /** Fraction of the screen height to push the focus point upward (when the info sheet is open). */
  offsetY: number;
  tOffsetY: number;
  autoRotate: boolean;
  camera: THREE.PerspectiveCamera | null;
  size: { width: number; height: number };
  /** Internal: focus transition bookkeeping. */
  _lastFocus: BodyId | null | undefined;
  _transitionT: number;
  _from: THREE.Vector3;
}

export const OVERVIEW_DISTANCE = 150;
export const MAX_DISTANCE = 340;

export function createOrbitControl(): OrbitControl {
  return {
    az: 0.6,
    polar: 1.25,
    dist: 300,
    tAz: 0.25,
    tPolar: 0.92,
    tDist: OVERVIEW_DISTANCE,
    vAz: 0,
    vPolar: 0,
    dragging: false,
    focus: null,
    target: new THREE.Vector3(),
    offsetY: 0,
    tOffsetY: 0,
    autoRotate: true,
    camera: null,
    size: { width: 1, height: 1 },
    _lastFocus: undefined,
    _transitionT: 1,
    _from: new THREE.Vector3(),
  };
}

export function focusDistance(id: BodyId) {
  const b = BODY_BY_ID[id];
  if (id === 'sun') return 24;
  return b.sceneRadius * 4.6 + 2.2;
}

export function minDistance(c: OrbitControl) {
  if (!c.focus) return 14;
  return BODY_BY_ID[c.focus].sceneRadius * 1.9 + 0.4;
}

/** Point the controller at a body (or back to the overview when `null`). */
export function setFocus(c: OrbitControl, id: BodyId | null) {
  c.focus = id;
  c.autoRotate = id === null;
  c.tDist = id ? focusDistance(id) : OVERVIEW_DISTANCE;
  if (!id) c.tPolar = 0.92;
  else c.tPolar = Math.min(Math.max(c.tPolar, 1.05), 1.4);
}

const desired = new THREE.Vector3();
const offset = new THREE.Vector3();

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function CameraRig({ control, sim }: { control: OrbitControl; sim: SimState }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);

  useFrame((_, rawDt) => {
    const c = control;
    const dt = Math.min(rawDt, 0.05);
    c.camera = camera;
    c.size = size;

    // Inertia & idle auto-rotation
    if (!c.dragging) {
      c.tAz += c.vAz * dt;
      c.tPolar += c.vPolar * dt;
      const decay = Math.exp(-dt * 3.2);
      c.vAz *= decay;
      c.vPolar *= decay;
      if (c.autoRotate) c.tAz += dt * 0.025;
    }
    c.tPolar = THREE.MathUtils.clamp(c.tPolar, 0.12, Math.PI - 0.12);
    c.tDist = THREE.MathUtils.clamp(c.tDist, minDistance(c), MAX_DISTANCE);

    const k = 1 - Math.exp(-dt * 5.5);
    c.az += (c.tAz - c.az) * k;
    c.polar += (c.tPolar - c.polar) * k;
    // Zoom eases slower in log space for a cinematic fly-in.
    const kd = 1 - Math.exp(-dt * 3.2);
    c.dist = Math.exp(Math.log(c.dist) + (Math.log(c.tDist) - Math.log(c.dist)) * kd);
    c.offsetY += (c.tOffsetY - c.offsetY) * k;

    // Focus transition: blend from the old look-at point to the live body position.
    if (c._lastFocus !== c.focus) {
      c._from.copy(c.target);
      c._transitionT = c._lastFocus === undefined ? 1 : 0;
      c._lastFocus = c.focus;
    }
    if (c.focus) bodyLocalPosition(c.focus, sim.timeMs, desired);
    else desired.set(0, 0, 0);
    if (c._transitionT < 1) {
      c._transitionT = Math.min(1, c._transitionT + dt / 1.4);
      c.target.copy(c._from).lerp(desired, easeInOutCubic(c._transitionT));
    } else {
      c.target.copy(desired);
    }

    offset.setFromSphericalCoords(c.dist, c.polar, c.az);
    camera.position.copy(c.target).add(offset);
    camera.lookAt(c.target);

    // Shift the projection so the focused body sits above the info sheet.
    const w = size.width;
    const h = size.height;
    if (Math.abs(c.offsetY) > 0.0005) {
      camera.setViewOffset(w, h, 0, c.offsetY * h, w, h);
    } else if (camera.view) {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
  });

  return null;
}
