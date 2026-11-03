import type { BodyId } from './planets';

export interface SpaceFact {
  id: string;
  title: string;
  body: string;
  body_id: BodyId;
  stat: string;
  statLabel: string;
}

export const SPACE_FACTS: SpaceFact[] = [
  {
    id: 'light',
    title: 'Sunlight is old news',
    body: 'The sunlight warming your face left the Sun’s surface about 8 minutes ago — and the energy itself may have been created in the core tens of thousands of years earlier.',
    body_id: 'sun',
    stat: '8m 20s',
    statLabel: 'Sun → Earth light travel',
  },
  {
    id: 'venus-day',
    title: 'A day longer than a year',
    body: 'Venus takes 243 Earth days to spin once, but only 225 days to orbit the Sun. Its day outlasts its year.',
    body_id: 'venus',
    stat: '243 d',
    statLabel: 'Venus rotation period',
  },
  {
    id: 'saturn-float',
    title: 'Saturn would float',
    body: 'Saturn’s average density is just 0.69 g/cm³ — less than water. In a (very) big enough bathtub, it would bob on the surface.',
    body_id: 'saturn',
    stat: '0.69',
    statLabel: 'g/cm³ average density',
  },
  {
    id: 'olympus',
    title: 'The tallest volcano',
    body: 'Olympus Mons on Mars rises about 22 km above the surrounding plains and is as wide as France.',
    body_id: 'mars',
    stat: '22 km',
    statLabel: 'Height of Olympus Mons',
  },
  {
    id: 'jupiter-shield',
    title: 'Jupiter, the giant',
    body: 'Jupiter holds more than twice the mass of every other planet combined. Its gravity reshapes the paths of comets and asteroids across the Solar System.',
    body_id: 'jupiter',
    stat: '318×',
    statLabel: 'Earth’s mass',
  },
  {
    id: 'neptune-wind',
    title: 'Supersonic storms',
    body: 'Neptune’s winds have been clocked at over 2,000 km/h — faster than the speed of sound on Earth.',
    body_id: 'neptune',
    stat: '2,100',
    statLabel: 'km/h peak winds',
  },
  {
    id: 'uranus-tilt',
    title: 'Rolling around the Sun',
    body: 'Uranus is tilted by 98°, so it essentially rolls along its orbit. Each pole gets about 42 years of daylight followed by 42 years of darkness.',
    body_id: 'uranus',
    stat: '98°',
    statLabel: 'Axial tilt',
  },
  {
    id: 'mercury-shrink',
    title: 'A shrinking world',
    body: 'Mercury has contracted by up to 7 km in radius as its huge iron core cooled, wrinkling the crust into giant cliffs called lobate scarps.',
    body_id: 'mercury',
    stat: '~7 km',
    statLabel: 'Radius lost over time',
  },
  {
    id: 'earth-speed',
    title: 'You are flying',
    body: 'Right now, Earth is carrying you around the Sun at roughly 107,000 km/h — about 30 kilometres every second.',
    body_id: 'earth',
    stat: '29.8',
    statLabel: 'km/s orbital speed',
  },
];

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Which planet is the hottest?',
    options: ['Mercury', 'Venus', 'Mars', 'Jupiter'],
    answer: 1,
    explanation: 'Venus’s thick CO₂ atmosphere traps heat, keeping its surface around 464 °C — hotter than Mercury.',
  },
  {
    id: 'q2',
    question: 'Which planet has the most known moons?',
    options: ['Jupiter', 'Uranus', 'Saturn', 'Neptune'],
    answer: 2,
    explanation: 'Saturn leads with 274 confirmed moons, far ahead of Jupiter’s 95.',
  },
  {
    id: 'q3',
    question: 'How long does sunlight take to reach Earth?',
    options: ['8 seconds', 'About 8 minutes', 'About 1 hour', 'About 1 day'],
    answer: 1,
    explanation: 'At 150 million km, light needs about 8 minutes and 20 seconds to reach us.',
  },
  {
    id: 'q4',
    question: 'Which planet rotates on its side?',
    options: ['Neptune', 'Saturn', 'Uranus', 'Mars'],
    answer: 2,
    explanation: 'Uranus has an axial tilt of about 98°, probably from a giant ancient impact.',
  },
  {
    id: 'q5',
    question: 'Where is the tallest volcano in the Solar System?',
    options: ['Venus', 'Earth', 'Io', 'Mars'],
    answer: 3,
    explanation: 'Olympus Mons on Mars stands about 22 km tall — 2.5 times the height of Everest.',
  },
  {
    id: 'q6',
    question: 'Which planet has the shortest day?',
    options: ['Earth', 'Jupiter', 'Saturn', 'Mercury'],
    answer: 1,
    explanation: 'Jupiter spins once every 9 hours 56 minutes, the fastest of all planets.',
  },
  {
    id: 'q7',
    question: 'Which planet is less dense than water?',
    options: ['Saturn', 'Neptune', 'Earth', 'Mercury'],
    answer: 0,
    explanation: 'Saturn’s average density is about 0.69 g/cm³, lower than water’s 1 g/cm³.',
  },
  {
    id: 'q8',
    question: 'On which planet does the Sun rise in the west?',
    options: ['Mars', 'Mercury', 'Venus', 'Jupiter'],
    answer: 2,
    explanation: 'Venus rotates backwards (retrograde), so the Sun rises in the west.',
  },
  {
    id: 'q9',
    question: 'Which planet was discovered using mathematics?',
    options: ['Uranus', 'Neptune', 'Saturn', 'Mars'],
    answer: 1,
    explanation: 'Urbain Le Verrier predicted Neptune’s position from irregularities in Uranus’s orbit; it was found in 1846.',
  },
  {
    id: 'q10',
    question: 'What fraction of the Solar System’s mass is in the Sun?',
    options: ['About 50%', 'About 75%', 'About 90%', 'About 99.8%'],
    answer: 3,
    explanation: 'The Sun contains roughly 99.86% of all the mass in the Solar System.',
  },
  {
    id: 'q11',
    question: 'Which is the smallest planet?',
    options: ['Mars', 'Mercury', 'Venus', 'Neptune'],
    answer: 1,
    explanation: 'Mercury is just 4,879 km across — only slightly larger than our Moon.',
  },
  {
    id: 'q12',
    question: 'Which planet has the fastest winds?',
    options: ['Jupiter', 'Earth', 'Neptune', 'Saturn'],
    answer: 2,
    explanation: 'Neptune’s winds exceed 2,000 km/h, the fastest measured in the Solar System.',
  },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
