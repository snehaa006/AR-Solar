import { useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ASTEROID_BELT, BodyData, BodyId, PLANETS, SUN } from '../data/planets';
import { getGlowTexture, getStarTexture } from './procedural';
import { BodyRegistry, SimState, advanceSim, bodyLocalPosition, spinFactor } from './sim';
import { getTexture, TextureKey } from './textures';

const SPHERE_SEGMENTS = 64;
const sharedSphere = new THREE.SphereGeometry(1, SPHERE_SEGMENTS, SPHERE_SEGMENTS / 2);
/** Hours of rotation shown per real second (Earth ≈ 20 s per spin at 1×). */
const SPIN_HOURS_PER_SECOND = 1.2;
const MOON_PERIOD_DAYS = 27.3217;

/* ----------------------------------------------------------------------------
 * Atmosphere: fresnel rim glow, brighter on the day side.
 * ------------------------------------------------------------------------- */
const atmosphereVertex = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mv = viewMatrix * worldPos;
    vNormalView = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uSunPos;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormalView;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormalView, vViewDir), 0.0), uPower);
    vec3 sunDir = normalize(uSunPos - vWorldPos);
    float lit = smoothstep(-0.35, 0.55, dot(normalize(vWorldNormal), sunDir));
    float a = fresnel * uIntensity * mix(0.12, 1.0, lit);
    gl_FragColor = vec4(uColor * a, a);
  }
`;

function useAtmosphereMaterial(color: string, intensity = 1.25, power = 2.6) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSunPos: { value: new THREE.Vector3() },
          uIntensity: { value: intensity },
          uPower: { value: power },
        },
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      }),
    [color, intensity, power],
  );
}

/* ----------------------------------------------------------------------------
 * Sun
 * ------------------------------------------------------------------------- */
function Sun({ registry, sim }: { registry: BodyRegistry; sim: SimState }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowA = useRef<THREE.Sprite>(null);
  const glowB = useRef<THREE.Sprite>(null);
  const tex = getTexture('sun');
  const glow = getGlowTexture();

  useEffect(() => {
    const m = meshRef.current;
    if (m) registry.set('sun', m);
    return () => {
      if (registry.get('sun') === m) registry.delete('sun');
    };
  }, [registry]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += ((2 * Math.PI) / SUN.siderealRotationHours) * SPIN_HOURS_PER_SECOND * 6 * spinFactor(sim) * dt;
    }
    const pulse = 1 + Math.sin(t * 0.9) * 0.025 + Math.sin(t * 2.3) * 0.012;
    if (glowA.current) glowA.current.scale.setScalar(SUN.sceneRadius * 4.4 * pulse);
    if (glowB.current) glowB.current.scale.setScalar(SUN.sceneRadius * 10 * (2 - pulse));
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={sharedSphere} scale={SUN.sceneRadius}>
        <meshBasicMaterial map={tex ?? undefined} color={tex ? new THREE.Color(1.35, 1.12, 0.92) : '#ffb347'} toneMapped={false} />
      </mesh>
      <sprite ref={glowA} scale={SUN.sceneRadius * 4.4}>
        <spriteMaterial map={glow} color="#ffc56b" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <sprite ref={glowB} scale={SUN.sceneRadius * 10}>
        <spriteMaterial map={glow} color="#ff7a1a" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <pointLight position={[0, 0, 0]} intensity={2.6} decay={0} color="#fff3e0" />
    </group>
  );
}

/* ----------------------------------------------------------------------------
 * Planet
 * ------------------------------------------------------------------------- */
function SaturnRings({ radius }: { radius: number }) {
  const tex = getTexture('saturnRing');
  const geometry = useMemo(() => {
    const inner = radius * 1.24;
    const outer = radius * 2.27;
    const g = new THREE.RingGeometry(inner, outer, 128, 1);
    // Remap UVs so the texture runs radially (inner edge → outer edge).
    const pos = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    uv.needsUpdate = true;
    return g;
  }, [radius]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        map={tex ?? undefined}
        color={tex ? '#ffffff' : '#d9c79c'}
        transparent
        opacity={tex ? 1 : 0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function Moon({ sim }: { sim: SimState }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = getTexture('moon');
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const days = sim.timeMs / 86_400_000;
    const a = (days / MOON_PERIOD_DAYS) * Math.PI * 2;
    const d = 2.3;
    m.position.set(Math.cos(a) * d, Math.sin(a) * 0.12, -Math.sin(a) * d);
    m.rotation.y = a + Math.PI; // tidally locked
  });
  return (
    <mesh ref={ref} geometry={sharedSphere} scale={0.27}>
      <meshStandardMaterial map={tex ?? undefined} color={tex ? '#ffffff' : '#9a9a9a'} roughness={1} metalness={0} />
    </mesh>
  );
}

function Planet({ body, sim, registry }: { body: BodyData; sim: SimState; registry: BodyRegistry }) {
  const orbitRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const tex = getTexture(body.id as TextureKey);
  const clouds = body.id === 'earth' ? getTexture('earthClouds') : null;
  const atmosphere = useAtmosphereMaterial(body.atmosphereColor ?? body.color, body.id === 'earth' ? 1.5 : 1.1);
  const tilt = THREE.MathUtils.degToRad(body.axialTiltDeg);
  const sunWorld = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const m = spinRef.current;
    if (m) registry.set(body.id, m);
    return () => {
      if (registry.get(body.id) === m) registry.delete(body.id);
    };
  }, [registry, body.id]);

  useFrame((_, dt) => {
    const g = orbitRef.current;
    if (!g) return;
    bodyLocalPosition(body.id, sim.timeMs, g.position);
    const spin = ((2 * Math.PI) / body.siderealRotationHours) * SPIN_HOURS_PER_SECOND * spinFactor(sim) * dt;
    if (spinRef.current) spinRef.current.rotation.y += spin;
    if (cloudRef.current) cloudRef.current.rotation.y += spin * 1.15;
    // Sun sits at the parent's origin; feed its world position to the atmosphere shader.
    if (g.parent) g.parent.getWorldPosition(sunWorld);
    atmosphere.uniforms.uSunPos.value.copy(sunWorld);
  });

  return (
    <group ref={orbitRef}>
      <group rotation={[0, 0, tilt]}>
        <mesh ref={spinRef} geometry={sharedSphere} scale={body.sceneRadius}>
          <meshStandardMaterial map={tex ?? undefined} color={tex ? '#ffffff' : body.color} roughness={0.95} metalness={0} />
        </mesh>
        {clouds && (
          <mesh ref={cloudRef} geometry={sharedSphere} scale={body.sceneRadius * 1.012}>
            <meshStandardMaterial alphaMap={clouds} transparent depthWrite={false} color="#ffffff" opacity={0.9} roughness={1} metalness={0} />
          </mesh>
        )}
        {body.atmosphereColor && (
          <mesh geometry={sharedSphere} scale={body.sceneRadius * 1.06} material={atmosphere} />
        )}
        {body.id === 'saturn' && <SaturnRings radius={body.sceneRadius} />}
      </group>
      {body.id === 'earth' && <Moon sim={sim} />}
    </group>
  );
}

/* ----------------------------------------------------------------------------
 * Orbits & asteroid belt
 * ------------------------------------------------------------------------- */
function OrbitLine({ body, selected }: { body: BodyData; selected: boolean }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const n = 256;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(Math.cos(a) * body.sceneDistance, 0, -Math.sin(a) * body.sceneDistance);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [body.sceneDistance]);

  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial
        color={selected ? body.color : '#8fa2ff'}
        transparent
        opacity={selected ? 0.85 : 0.2}
        depthWrite={false}
      />
    </lineLoop>
  );
}

function AsteroidBelt({ sim, count = 1400 }: { sim: SimState; count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = ASTEROID_BELT.inner + Math.pow(Math.random(), 0.8) * (ASTEROID_BELT.outer - ASTEROID_BELT.inner);
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 2] = Math.sin(a) * r;
      const shade = 0.45 + Math.random() * 0.4;
      colors[i * 3] = shade * 1.05;
      colors[i * 3 + 1] = shade * 0.95;
      colors[i * 3 + 2] = shade * 0.85;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [count]);

  const worldScale = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    if (!sim.paused) pts.rotation.y += dt * 0.004 * sim.daysPerSecond;
    // Attenuated point sizes ignore object scale, so apply it manually (AR/tabletop are scaled down).
    pts.getWorldScale(worldScale);
    (pts.material as THREE.PointsMaterial).size = 0.22 * worldScale.x;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        map={getStarTexture()}
        size={0.22}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        opacity={0.9}
      />
    </points>
  );
}

/* ----------------------------------------------------------------------------
 * Public component
 * ------------------------------------------------------------------------- */
export interface SolarSystemProps {
  sim: SimState;
  registry: BodyRegistry;
  selectedId: BodyId | null;
  showOrbits?: boolean;
  /** Fewer particles for AR (smaller on screen, more GPU budget for camera). */
  lite?: boolean;
}

export function SolarSystem({ sim, registry, selectedId, showOrbits = true, lite = false }: SolarSystemProps) {
  return (
    <group>
      <ambientLight intensity={0.16} color="#9fb0ff" />
      <Sun registry={registry} sim={sim} />
      {PLANETS.map((p) => (
        <Planet key={p.id} body={p} sim={sim} registry={registry} />
      ))}
      {showOrbits && PLANETS.map((p) => <OrbitLine key={p.id} body={p} selected={selectedId === p.id} />)}
      <AsteroidBelt sim={sim} count={lite ? 700 : 1400} />
    </group>
  );
}

/* ----------------------------------------------------------------------------
 * Deep space backdrop (3D mode only)
 * ------------------------------------------------------------------------- */
export function SpaceBackdrop() {
  const milkyWay = getTexture('milkyWay');
  const stars = useMemo(() => {
    const count = 2600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#cfd9ff'),
      new THREE.Color('#9fb6ff'),
      new THREE.Color('#ffe7c4'),
      new THREE.Color('#ffd2a1'),
    ];
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.randomDirection().multiplyScalar(420 + Math.random() * 120);
      positions.set([v.x, v.y, v.z], i * 3);
      const c = palette[Math.floor(Math.random() * palette.length)];
      const b = 0.35 + Math.pow(Math.random(), 3) * 0.9;
      colors.set([c.r * b, c.g * b, c.b * b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <group>
      {milkyWay && (
        <mesh geometry={sharedSphere} scale={900}>
          <meshBasicMaterial map={milkyWay} side={THREE.BackSide} color="#7d86a8" toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      <points geometry={stars}>
        <pointsMaterial
          map={getStarTexture()}
          size={2.6}
          sizeAttenuation={false}
          vertexColors
          transparent
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/** Advances simulated time. Render it first inside the Canvas so every other
 *  frame subscriber reads the same timestamp. */
export function SimClock({ sim }: { sim: SimState }) {
  useFrame((_, dt) => advanceSim(sim, dt));
  return null;
}
