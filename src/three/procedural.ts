import * as THREE from 'three';

/**
 * Canvas-free procedural textures (work identically on expo-gl and WebGL).
 */

function makeDataTexture(size: number, fill: (u: number, v: number) => [number, number, number, number]) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const [r, g, b, a] = fill(u, v);
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

let glowTex: THREE.DataTexture | null = null;
/** Soft radial falloff used for the Sun's glow and corona sprites. */
export function getGlowTexture() {
  if (!glowTex) {
    glowTex = makeDataTexture(128, (u, v) => {
      const d = Math.min(1, Math.hypot(u - 0.5, v - 0.5) * 2);
      const a = Math.pow(1 - d, 2.4) * (1 - d * 0.15);
      return [255, 255, 255, Math.round(Math.max(0, a) * 255)];
    });
  }
  return glowTex;
}

let starTex: THREE.DataTexture | null = null;
/** Round, slightly bloomy point sprite for stars and asteroids. */
export function getStarTexture() {
  if (!starTex) {
    starTex = makeDataTexture(64, (u, v) => {
      const d = Math.min(1, Math.hypot(u - 0.5, v - 0.5) * 2);
      const core = Math.max(0, 1 - d * 2.2);
      const halo = Math.pow(Math.max(0, 1 - d), 3) * 0.55;
      const a = Math.min(1, core + halo);
      return [255, 255, 255, Math.round(a * 255)];
    });
  }
  return starTex;
}

let ringTex: THREE.DataTexture | null = null;
/** Thin luminous ring used for the AR placement reticle & tabletop. */
export function getHaloRingTexture() {
  if (!ringTex) {
    ringTex = makeDataTexture(128, (u, v) => {
      const d = Math.hypot(u - 0.5, v - 0.5) * 2;
      const ring = Math.exp(-Math.pow((d - 0.92) / 0.035, 2));
      const fill = d < 0.92 ? 0.08 * (1 - d) : 0;
      const a = Math.min(1, ring + fill);
      return [255, 255, 255, Math.round(a * 255)];
    });
  }
  return ringTex;
}
