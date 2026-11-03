/**
 * Astronomical data.
 * Physical & orbital values: NASA Planetary Fact Sheet (nssdc.gsfc.nasa.gov/planetary/factsheet).
 * Mean longitudes at J2000: JPL "Approximate Positions of the Planets" (Standish).
 * Moon counts: NASA Science (confirmed/recognised moons, 2025).
 */

export type BodyId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export type PlanetId = Exclude<BodyId, 'sun'>;

export interface BodyData {
  id: BodyId;
  name: string;
  type: string;
  tagline: string;
  description: string;
  color: string; // UI accent colour
  atmosphereColor?: string;
  /** Physical data */
  diameterKm: number;
  massE24Kg: number;
  gravity: number; // m/s²
  meanTempC: number;
  moons: number;
  /** Orbital data (0 for the Sun) */
  distanceMKm: number; // mean distance from the Sun, million km
  distanceAU: number;
  orbitalPeriodDays: number;
  orbitalVelocityKmS: number;
  meanLongitudeJ2000Deg: number;
  /** Rotation */
  siderealRotationHours: number; // absolute value; retrograde is encoded through axial tilt > 90°
  solarDayHours: number;
  axialTiltDeg: number;
  /** Human readable strings */
  dayLabel: string;
  yearLabel: string;
  facts: string[];
  /** Scene (compressed, not to scale) */
  sceneRadius: number;
  sceneDistance: number;
}

export const SUN: BodyData = {
  id: 'sun',
  name: 'Sun',
  type: 'G-type main-sequence star',
  tagline: 'The star at the heart of it all',
  description:
    'A 4.6-billion-year-old ball of hot plasma holding 99.86% of the Solar System’s mass. Nuclear fusion in its core turns about 600 million tonnes of hydrogen into helium every second.',
  color: '#ffb347',
  diameterKm: 1392700,
  massE24Kg: 1988500,
  gravity: 274,
  meanTempC: 5500,
  moons: 0,
  distanceMKm: 0,
  distanceAU: 0,
  orbitalPeriodDays: 0,
  orbitalVelocityKmS: 0,
  meanLongitudeJ2000Deg: 0,
  siderealRotationHours: 609.12,
  solarDayHours: 609.12,
  axialTiltDeg: 7.25,
  dayLabel: '25.4 Earth days (equator)',
  yearLabel: '~230 million yrs around the galaxy',
  facts: [
    'Light from the Sun’s surface takes about 8 minutes 20 seconds to reach Earth.',
    'You could fit roughly 1.3 million Earths inside the Sun.',
    'The core reaches around 15 million °C, while the corona is mysteriously hotter than the surface.',
    'The Sun spins faster at its equator (~25 days) than at its poles (~35 days).',
  ],
  sceneRadius: 4.2,
  sceneDistance: 0,
};

export const PLANETS: BodyData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial planet',
    tagline: 'The swift messenger',
    description:
      'The smallest planet and the closest to the Sun. With almost no atmosphere to trap heat, its surface swings from 430 °C by day to −180 °C at night.',
    color: '#b7aea4',
    diameterKm: 4879,
    massE24Kg: 0.33,
    gravity: 3.7,
    meanTempC: 167,
    moons: 0,
    distanceMKm: 57.9,
    distanceAU: 0.387,
    orbitalPeriodDays: 87.969,
    orbitalVelocityKmS: 47.4,
    meanLongitudeJ2000Deg: 252.25,
    siderealRotationHours: 1407.6,
    solarDayHours: 4222.6,
    axialTiltDeg: 0.03,
    dayLabel: '176 Earth days',
    yearLabel: '88 Earth days',
    facts: [
      'A single solar day on Mercury (sunrise to sunrise) lasts two Mercury years.',
      'Despite being closest to the Sun, it is not the hottest planet — Venus is.',
      'It is shrinking: as its iron core cools, the crust wrinkles into cliffs kilometres high.',
      'Water ice hides in permanently shadowed craters near its poles.',
    ],
    sceneRadius: 0.42,
    sceneDistance: 8,
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial planet',
    tagline: 'Earth’s scorching twin',
    description:
      'Similar in size to Earth, but wrapped in a crushing carbon-dioxide atmosphere with sulfuric-acid clouds. A runaway greenhouse effect makes it the hottest planet.',
    color: '#e8c48a',
    atmosphereColor: '#ffcf87',
    diameterKm: 12104,
    massE24Kg: 4.87,
    gravity: 8.9,
    meanTempC: 464,
    moons: 0,
    distanceMKm: 108.2,
    distanceAU: 0.723,
    orbitalPeriodDays: 224.701,
    orbitalVelocityKmS: 35.0,
    meanLongitudeJ2000Deg: 181.98,
    siderealRotationHours: 5832.5,
    solarDayHours: 2802,
    axialTiltDeg: 177.4,
    dayLabel: '117 Earth days',
    yearLabel: '225 Earth days',
    facts: [
      'Venus spins backwards — the Sun rises in the west and sets in the east.',
      'One rotation (243 Earth days) takes longer than its whole year (225 days).',
      'Surface pressure is about 92 times Earth’s — like being 900 m under the ocean.',
      'It is the brightest natural object in the night sky after the Moon.',
    ],
    sceneRadius: 0.95,
    sceneDistance: 11.5,
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial planet',
    tagline: 'Our pale blue dot',
    description:
      'The only world known to host life. Liquid water covers 71% of its surface, and a magnetic field and atmosphere shield it from harmful solar radiation.',
    color: '#4f9dff',
    atmosphereColor: '#5fb4ff',
    diameterKm: 12756,
    massE24Kg: 5.97,
    gravity: 9.8,
    meanTempC: 15,
    moons: 1,
    distanceMKm: 149.6,
    distanceAU: 1,
    orbitalPeriodDays: 365.256,
    orbitalVelocityKmS: 29.8,
    meanLongitudeJ2000Deg: 100.46,
    siderealRotationHours: 23.934,
    solarDayHours: 24,
    axialTiltDeg: 23.44,
    dayLabel: '24 hours',
    yearLabel: '365.25 days',
    facts: [
      'Earth is the densest planet in the Solar System.',
      'Its rotation is gradually slowing — days get ~1.8 ms longer every century.',
      'The Moon is drifting away from Earth by about 3.8 cm per year.',
      'Earth is the only planet not named after a Greek or Roman god.',
    ],
    sceneRadius: 1,
    sceneDistance: 15,
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial planet',
    tagline: 'The red frontier',
    description:
      'A cold desert world coloured by iron oxide dust. It hosts the tallest volcano and deepest canyon in the Solar System, and once had rivers and lakes.',
    color: '#e0703f',
    atmosphereColor: '#ff9b6b',
    diameterKm: 6792,
    massE24Kg: 0.642,
    gravity: 3.7,
    meanTempC: -65,
    moons: 2,
    distanceMKm: 228.0,
    distanceAU: 1.524,
    orbitalPeriodDays: 686.98,
    orbitalVelocityKmS: 24.1,
    meanLongitudeJ2000Deg: 355.45,
    siderealRotationHours: 24.623,
    solarDayHours: 24.66,
    axialTiltDeg: 25.19,
    dayLabel: '24 h 37 min',
    yearLabel: '687 Earth days',
    facts: [
      'Olympus Mons is about 22 km high — nearly 2.5 times Mount Everest.',
      'Valles Marineris would stretch across the entire continental United States.',
      'Sunsets on Mars glow blue because fine dust scatters blue light forward.',
      'Its two tiny moons, Phobos and Deimos, may be captured asteroids.',
    ],
    sceneRadius: 0.6,
    sceneDistance: 18.5,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas giant',
    tagline: 'King of the planets',
    description:
      'More than twice as massive as all other planets combined. Its Great Red Spot is a storm wider than Earth that has raged for centuries.',
    color: '#d8b48a',
    atmosphereColor: '#f3d2a6',
    diameterKm: 142984,
    massE24Kg: 1898,
    gravity: 23.1,
    meanTempC: -110,
    moons: 95,
    distanceMKm: 778.5,
    distanceAU: 5.203,
    orbitalPeriodDays: 4332.59,
    orbitalVelocityKmS: 13.1,
    meanLongitudeJ2000Deg: 34.4,
    siderealRotationHours: 9.925,
    solarDayHours: 9.93,
    axialTiltDeg: 3.13,
    dayLabel: '9 h 56 min',
    yearLabel: '11.9 Earth years',
    facts: [
      'Jupiter has the shortest day of any planet — under 10 hours.',
      'Its moon Ganymede is bigger than the planet Mercury.',
      'Europa likely hides a global saltwater ocean beneath its icy crust.',
      'More than 1,300 Earths could fit inside Jupiter.',
    ],
    sceneRadius: 2.7,
    sceneDistance: 26,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas giant',
    tagline: 'Jewel of the Solar System',
    description:
      'Famous for its dazzling rings of ice and rock. Saturn is the least dense planet — on average it is less dense than water.',
    color: '#e8d29b',
    atmosphereColor: '#f6e2b0',
    diameterKm: 120536,
    massE24Kg: 568,
    gravity: 9.0,
    meanTempC: -140,
    moons: 274,
    distanceMKm: 1432.0,
    distanceAU: 9.537,
    orbitalPeriodDays: 10759.22,
    orbitalVelocityKmS: 9.7,
    meanLongitudeJ2000Deg: 49.94,
    siderealRotationHours: 10.656,
    solarDayHours: 10.7,
    axialTiltDeg: 26.73,
    dayLabel: '10 h 42 min',
    yearLabel: '29.4 Earth years',
    facts: [
      'Its main rings span about 280,000 km but are often only ~10 m thick.',
      'Saturn has the most known moons of any planet: 274 and counting.',
      'Titan, its largest moon, has lakes and rivers of liquid methane.',
      'A six-sided jet stream — the hexagon — swirls around its north pole.',
    ],
    sceneRadius: 2.3,
    sceneDistance: 33.5,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice giant',
    tagline: 'The sideways planet',
    description:
      'An ice giant tipped on its side, likely by an ancient collision. Methane in its atmosphere gives it a pale cyan colour.',
    color: '#9fe3ec',
    atmosphereColor: '#a6f0ff',
    diameterKm: 51118,
    massE24Kg: 86.8,
    gravity: 8.7,
    meanTempC: -195,
    moons: 29,
    distanceMKm: 2867.0,
    distanceAU: 19.19,
    orbitalPeriodDays: 30688.5,
    orbitalVelocityKmS: 6.8,
    meanLongitudeJ2000Deg: 313.23,
    siderealRotationHours: 17.24,
    solarDayHours: 17.2,
    axialTiltDeg: 97.77,
    dayLabel: '17 h 14 min',
    yearLabel: '84 Earth years',
    facts: [
      'Its axis is tilted ~98°, so each pole gets 42 years of continuous sunlight.',
      'Uranus was the first planet discovered with a telescope (William Herschel, 1781).',
      'It has the coldest recorded atmosphere of any planet: −224 °C.',
      'Its moons are named after characters from Shakespeare and Alexander Pope.',
    ],
    sceneRadius: 1.6,
    sceneDistance: 40,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice giant',
    tagline: 'The windswept blue world',
    description:
      'The most distant planet, a deep-blue ice giant with the fastest winds in the Solar System — over 2,000 km/h.',
    color: '#4b70ff',
    atmosphereColor: '#6f8dff',
    diameterKm: 49528,
    massE24Kg: 102,
    gravity: 11.0,
    meanTempC: -200,
    moons: 16,
    distanceMKm: 4515.0,
    distanceAU: 30.07,
    orbitalPeriodDays: 60182,
    orbitalVelocityKmS: 5.4,
    meanLongitudeJ2000Deg: 304.88,
    siderealRotationHours: 16.11,
    solarDayHours: 16.1,
    axialTiltDeg: 28.32,
    dayLabel: '16 h 6 min',
    yearLabel: '164.8 Earth years',
    facts: [
      'Neptune was found by mathematics before it was seen — predicted from Uranus’s wobble.',
      'It completed its first full orbit since discovery only in 2011.',
      'Its moon Triton orbits backwards and erupts nitrogen geysers.',
      'Sunlight takes over 4 hours to reach Neptune.',
    ],
    sceneRadius: 1.55,
    sceneDistance: 46,
  },
];

export const ALL_BODIES: BodyData[] = [SUN, ...PLANETS];

export const BODY_BY_ID: Record<BodyId, BodyData> = Object.fromEntries(
  ALL_BODIES.map((b) => [b.id, b]),
) as Record<BodyId, BodyData>;

/** Scene sizes for the asteroid belt (between Mars and Jupiter). */
export const ASTEROID_BELT = { inner: 20.8, outer: 23 };

const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
export const MS_PER_DAY = 86_400_000;

/** Days since J2000 for a JS timestamp. */
export function daysSinceJ2000(timeMs: number) {
  return (timeMs - J2000_MS) / MS_PER_DAY;
}

/** Heliocentric ecliptic longitude (radians, circular-orbit approximation). */
export function orbitalAngle(body: BodyData, timeMs: number) {
  if (!body.orbitalPeriodDays) return 0;
  const d = daysSinceJ2000(timeMs);
  const deg = body.meanLongitudeJ2000Deg + (360 * d) / body.orbitalPeriodDays;
  return (deg * Math.PI) / 180;
}

/** Thousands-separated number formatting (independent of Intl availability). */
export function formatNumber(n: number, digits = 0) {
  const neg = n < 0;
  const fixed = Math.abs(n).toFixed(digits);
  const [int, frac] = fixed.split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '−' : '') + withSep + (frac ? '.' + frac : '');
}
