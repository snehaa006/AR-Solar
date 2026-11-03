import { ALL_BODIES, BodyId } from './data/planets';
import { createOrbitControl, OrbitControl } from './three/CameraRig';
import { BodyRegistry, createSim, SimState } from './three/sim';

/** Long-lived, mutable objects shared by every screen (kept outside React state for 60 fps updates). */
export interface World {
  sim: SimState;
  control: OrbitControl;
  registry: BodyRegistry;
}

export function createWorld(): World {
  return { sim: createSim(), control: createOrbitControl(), registry: new Map() };
}

export const SPEEDS = [
  { label: '1 day/s', dps: 1 },
  { label: '1 week/s', dps: 7 },
  { label: '1 month/s', dps: 30 },
  { label: '1 year/s', dps: 365.25 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatSimDate(ms: number) {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const ORDER = ALL_BODIES.map((b) => b.id);
export function stepBody(id: BodyId, dir: 1 | -1): BodyId {
  const i = ORDER.indexOf(id);
  return ORDER[(i + dir + ORDER.length) % ORDER.length];
}
