import * as THREE from 'three';
import { BODY_BY_ID, BodyId, MS_PER_DAY, orbitalAngle } from '../data/planets';

/** Mutable simulation state shared between React Native UI and the 3D scene. */
export interface SimState {
  timeMs: number; // simulated date
  daysPerSecond: number;
  paused: boolean;
}

export function createSim(): SimState {
  return { timeMs: Date.now(), daysPerSecond: 7, paused: false };
}

export function advanceSim(sim: SimState, dt: number) {
  if (sim.paused) return;
  // Clamp large frame gaps (backgrounding, tab switches) to keep motion smooth.
  const step = Math.min(dt, 0.1);
  sim.timeMs += step * sim.daysPerSecond * MS_PER_DAY;
}

/** Visual spin rate multiplier — keeps rotation legible regardless of orbital speed. */
export function spinFactor(sim: SimState) {
  if (sim.paused) return 0;
  return 0.6 + Math.log10(1 + sim.daysPerSecond) * 0.8;
}

/** Position of a body in local solar-system space (Sun at origin, ecliptic = XZ plane). */
export function bodyLocalPosition(id: BodyId, timeMs: number, out: THREE.Vector3) {
  const body = BODY_BY_ID[id];
  if (!body.sceneDistance) return out.set(0, 0, 0);
  const a = orbitalAngle(body, timeMs);
  return out.set(Math.cos(a) * body.sceneDistance, 0, -Math.sin(a) * body.sceneDistance);
}

/** Registry of rendered body meshes, used for screen-space picking and labels. */
export type BodyRegistry = Map<BodyId, THREE.Object3D>;

const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();

export interface ScreenHit {
  id: BodyId;
  x: number;
  y: number;
  radiusPx: number;
  depth: number;
  visible: boolean;
}

/** Projects a registered body (unit-sphere mesh) to screen pixels. */
export function projectBody(
  obj: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): Omit<ScreenHit, 'id'> {
  // Registered meshes use a unit sphere scaled to the body's radius.
  obj.getWorldPosition(tmpV);
  obj.getWorldScale(tmpS);
  const worldRadius = tmpS.x;
  const distance = tmpV.distanceTo(camera.position);
  tmpV.project(camera);
  const visible = tmpV.z > -1 && tmpV.z < 1 && Math.abs(tmpV.x) < 1.3 && Math.abs(tmpV.y) < 1.3;
  const x = (tmpV.x * 0.5 + 0.5) * width;
  const y = (-tmpV.y * 0.5 + 0.5) * height;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const radiusPx = (worldRadius / Math.max(distance, 1e-4) / Math.tan(fov / 2)) * (height / 2) * (camera.zoom || 1);
  return { x, y, radiusPx, depth: distance, visible };
}

/** Finds the body under a tap, generous enough for small planets on phones. */
export function pickBody(
  registry: BodyRegistry,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  tapX: number,
  tapY: number,
  withLabels = false,
): BodyId | null {
  let best: { id: BodyId; score: number } | null = null;
  registry.forEach((obj, id) => {
    const p = projectBody(obj, camera, width, height);
    if (!p.visible) return;
    const d = Math.hypot(p.x - tapX, p.y - tapY);
    const hitRadius = Math.max(p.radiusPx * 1.15, 30);
    // Labels are drawn just below each body; count taps on them too.
    const labelY = p.y + p.radiusPx + 16;
    const onLabel = withLabels && Math.abs(tapX - p.x) < 44 && Math.abs(tapY - labelY) < 14;
    if (d > hitRadius && !onLabel) return;
    const score = (onLabel ? 0.5 : d / hitRadius) + p.depth * 0.0001;
    if (!best || score < best.score) best = { id, score };
  });
  return best ? (best as { id: BodyId }).id : null;
}
