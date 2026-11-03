import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QUIZ_QUESTIONS, QuizQuestion, shuffle, SPACE_FACTS } from '../data/discover';
import { BODY_BY_ID, BodyData, BodyId, formatNumber, PLANETS, SUN } from '../data/planets';
import { Glass } from '../ui/Glass';
import { PlanetOrb } from '../ui/PlanetOrb';
import { TAB_BAR_HEIGHT, tap } from '../ui/TabBar';

type Section = 'facts' | 'compare' | 'quiz';

interface Props {
  onExplore: (id: BodyId) => void;
}

export function DiscoverScreen({ onExplore }: Props) {
  const insets = useSafeAreaInsets();
  const [section, setSection] = useState<Section>('facts');
  const fade = useRef(new Animated.Value(1)).current;

  const switchTo = (s: Section) => {
    if (s === section) return;
    tap();
    fade.setValue(0);
    setSection(s);
    Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  };

  return (
    <View style={StyleSheet.absoluteFill} className="bg-space-950">
      <LinearGradient colors={['#0c1030', '#05060f', '#03040a']} style={StyleSheet.absoluteFill} />
      <View style={{ paddingTop: insets.top + 14 }} className="px-5">
        <Text className="font-display text-white/50" style={{ fontSize: 12, letterSpacing: 5 }}>
          DISCOVER
        </Text>
        <Text className="font-display text-white mt-1" style={{ fontSize: 32 }}>
          Learn the cosmos
        </Text>
        <View className="flex-row mt-4 rounded-2xl p-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          {(
            [
              { k: 'facts', label: 'Facts', icon: 'bulb-outline' },
              { k: 'compare', label: 'Compare', icon: 'stats-chart-outline' },
              { k: 'quiz', label: 'Quiz', icon: 'trophy-outline' },
            ] as const
          ).map((t) => {
            const active = section === t.k;
            return (
              <Pressable key={t.k} onPress={() => switchTo(t.k)} className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl" style={{ backgroundColor: active ? 'rgba(124,140,255,0.3)' : 'transparent' }}>
                <Ionicons name={t.icon} size={15} color={active ? '#fff' : 'rgba(255,255,255,0.55)'} />
                <Text className={active ? 'font-body-semibold text-white ml-1.5' : 'font-body-medium text-white/55 ml-1.5'} style={{ fontSize: 13 }}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Animated.View style={{ flex: 1, opacity: fade }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {section === 'facts' && <FactsSection onExplore={onExplore} />}
          {section === 'compare' && <CompareSection onExplore={onExplore} />}
          {section === 'quiz' && <QuizSection />}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------------- */
/* Facts                                                                     */
/* ------------------------------------------------------------------------- */
function FactsSection({ onExplore }: Props) {
  const dayIndex = Math.floor(Date.now() / 86_400_000) % SPACE_FACTS.length;
  const hero = SPACE_FACTS[dayIndex];
  const heroBody = BODY_BY_ID[hero.body_id];
  const rest = SPACE_FACTS.filter((f) => f.id !== hero.id);

  return (
    <View>
      <Pressable onPress={() => onExplore(hero.body_id)} className="rounded-3xl overflow-hidden mb-5">
        <LinearGradient colors={[heroBody.color + 'aa', '#1a1f4a', '#0a0d22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
          <View className="flex-row items-center justify-between">
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <Text className="font-body-semibold text-white" style={{ fontSize: 10.5, letterSpacing: 1.4 }}>
                FACT OF THE DAY
              </Text>
            </View>
            <PlanetOrb id={hero.body_id} size={54} glow />
          </View>
          <Text className="font-display text-white mt-2" style={{ fontSize: 24, lineHeight: 29 }}>
            {hero.title}
          </Text>
          <Text className="font-body text-white/85 mt-2" style={{ fontSize: 14, lineHeight: 21 }}>
            {hero.body}
          </Text>
          <View className="flex-row items-end mt-4">
            <Text className="font-display text-white" style={{ fontSize: 34 }}>
              {hero.stat}
            </Text>
            <Text className="font-body text-white/70 ml-2 mb-1.5" style={{ fontSize: 12 }}>
              {hero.statLabel}
            </Text>
          </View>
          <View className="flex-row items-center mt-3">
            <Text className="font-body-semibold text-white" style={{ fontSize: 13 }}>
              Fly to {heroBody.name}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 6 }} />
          </View>
        </LinearGradient>
      </Pressable>

      {rest.map((f) => {
        const b = BODY_BY_ID[f.body_id];
        return (
          <Pressable key={f.id} onPress={() => onExplore(f.body_id)} className="mb-3">
            <Glass radius={22}>
              <View className="flex-row p-4">
                <PlanetOrb id={f.body_id} size={44} />
                <View className="flex-1 ml-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-body-medium uppercase" style={{ color: b.color, fontSize: 10.5, letterSpacing: 1.3 }}>
                      {b.name}
                    </Text>
                    <Text className="font-display text-white" style={{ fontSize: 14 }}>
                      {f.stat}
                    </Text>
                  </View>
                  <Text className="font-display-medium text-white mt-0.5" style={{ fontSize: 16.5 }}>
                    {f.title}
                  </Text>
                  <Text className="font-body text-white/65 mt-1" style={{ fontSize: 13, lineHeight: 19 }}>
                    {f.body}
                  </Text>
                </View>
              </View>
            </Glass>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------------- */
/* Compare                                                                   */
/* ------------------------------------------------------------------------- */
interface Metric {
  key: string;
  label: string;
  unit: string;
  get: (b: BodyData) => number;
  format: (v: number) => string;
  log?: boolean;
  note: string;
}

const METRICS: Metric[] = [
  { key: 'diameter', label: 'Size', unit: 'km', get: (b) => b.diameterKm, format: (v) => `${formatNumber(v)} km`, note: 'Equatorial diameter' },
  { key: 'distance', label: 'Distance', unit: 'AU', get: (b) => b.distanceAU, format: (v) => `${v} AU`, note: 'Mean distance from the Sun (1 AU = 149.6 million km)' },
  { key: 'mass', label: 'Mass', unit: '× Earth', get: (b) => b.massE24Kg / 5.97, format: (v) => `${formatNumber(v, v < 1 ? 3 : 1)}×`, log: true, note: 'Mass relative to Earth (log scale)' },
  { key: 'gravity', label: 'Gravity', unit: 'm/s²', get: (b) => b.gravity, format: (v) => `${v} m/s²`, note: 'Surface gravity (cloud tops for giants)' },
  { key: 'moons', label: 'Moons', unit: '', get: (b) => b.moons, format: (v) => `${v}`, note: 'Confirmed moons' },
  { key: 'day', label: 'Day', unit: 'h', get: (b) => b.solarDayHours, format: (v) => (v > 48 ? `${formatNumber(v / 24, 0)} d` : `${v.toFixed(1)} h`), log: true, note: 'Length of a solar day (log scale)' },
  { key: 'year', label: 'Year', unit: 'd', get: (b) => b.orbitalPeriodDays, format: (v) => (v > 730 ? `${(v / 365.25).toFixed(1)} yr` : `${formatNumber(v)} d`), log: true, note: 'Time to orbit the Sun (log scale)' },
  { key: 'temp', label: 'Temp', unit: '°C', get: (b) => b.meanTempC, format: (v) => `${formatNumber(v)} °C`, note: 'Mean temperature' },
];

function CompareSection({ onExplore }: Props) {
  const [metricKey, setMetricKey] = useState('diameter');
  const [weight, setWeight] = useState('70');
  const metric = METRICS.find((m) => m.key === metricKey)!;
  const bars = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bars.setValue(0);
    Animated.timing(bars, { toValue: 1, duration: 650, useNativeDriver: false }).start();
  }, [metricKey, bars]);

  const rows = useMemo(() => {
    const values = PLANETS.map((p) => ({ p, v: metric.get(p) }));
    if (metric.key === 'temp') {
      const min = -230;
      const max = Math.max(...values.map((x) => x.v));
      return values.map(({ p, v }) => ({ p, v, frac: (v - min) / (max - min) }));
    }
    if (metric.log) {
      const logs = values.map((x) => Math.log10(Math.max(x.v, 1e-3)));
      const lo = Math.min(...logs) - 0.3;
      const hi = Math.max(...logs);
      return values.map(({ p, v }, i) => ({ p, v, frac: (logs[i] - lo) / (hi - lo) }));
    }
    const max = Math.max(...values.map((x) => x.v));
    return values.map(({ p, v }) => ({ p, v, frac: max ? v / max : 0 }));
  }, [metric]);

  const kg = parseFloat(weight.replace(',', '.'));
  const validKg = Number.isFinite(kg) && kg > 0 && kg < 1000;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ paddingRight: 8 }}>
        {METRICS.map((m) => {
          const active = m.key === metricKey;
          return (
            <Pressable
              key={m.key}
              onPress={() => {
                tap();
                setMetricKey(m.key);
              }}
              className="rounded-full px-4 py-2 mr-2"
              style={{ backgroundColor: active ? '#7c8cff' : 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: active ? '#aab4ff' : 'rgba(255,255,255,0.1)' }}
            >
              <Text className={active ? 'font-body-semibold' : 'font-body-medium'} style={{ fontSize: 13, color: active ? '#060815' : 'rgba(255,255,255,0.8)' }}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Glass radius={24}>
        <View className="p-4">
          <Text className="font-body text-white/50 mb-3" style={{ fontSize: 12 }}>
            {metric.note}
          </Text>
          {rows.map(({ p, v, frac }) => (
            <Pressable key={p.id} onPress={() => onExplore(p.id)} className="flex-row items-center mb-3">
              <PlanetOrb id={p.id} size={26} />
              <Text className="font-body-medium text-white ml-2.5" style={{ fontSize: 13, width: 66 }}>
                {p.name}
              </Text>
              <View className="flex-1 h-2.5 rounded-full overflow-hidden mr-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Animated.View
                  style={{
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: p.color,
                    width: bars.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.max(2, Math.min(1, frac) * 100)}%`] }),
                  }}
                />
              </View>
              <Text className="font-display text-white text-right" style={{ fontSize: 12.5, width: 82 }} numberOfLines={1}>
                {metric.format(v)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Glass>

      {/* True scale lineup */}
      <Text className="font-display text-white mt-6 mb-1" style={{ fontSize: 20 }}>
        True-scale size lineup
      </Text>
      <Text className="font-body text-white/50 mb-3" style={{ fontSize: 12.5 }}>
        Planet diameters drawn to the same scale. The Sun’s edge is on the left — it is ~10× wider than Jupiter.
      </Text>
      <Glass radius={24}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-end', paddingRight: 18, height: 170 }}>
          <View style={{ width: 70, height: 170, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: 18, top: -600 + 85, width: 1200, height: 1200, borderRadius: 600, overflow: 'hidden' }}>
              <LinearGradient colors={['#ffd27a', '#ff9a2e', '#ff6a00']} start={{ x: 1, y: 0.5 }} end={{ x: 0.8, y: 0.5 }} style={StyleSheet.absoluteFill} />
            </View>
          </View>
          {PLANETS.map((p) => {
            const px = (p.diameterKm / 142984) * 120;
            return (
              <View key={p.id} className="items-center justify-end mx-2.5" style={{ height: 170, paddingBottom: 14 }}>
                <PlanetOrb id={p.id} size={Math.max(px, 2)} />
                <Text className="font-body-medium text-white/70 mt-2" style={{ fontSize: 10.5 }}>
                  {p.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </Glass>

      {/* Weight calculator */}
      <Text className="font-display text-white mt-6 mb-1" style={{ fontSize: 20 }}>
        Your weight on other worlds
      </Text>
      <Text className="font-body text-white/50 mb-3" style={{ fontSize: 12.5 }}>
        Your mass stays the same — but gravity pulls differently everywhere.
      </Text>
      <Glass radius={24}>
        <View className="p-4">
          <View className="flex-row items-center rounded-2xl px-4 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Ionicons name="body-outline" size={18} color="#aab4ff" />
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              maxLength={5}
              placeholder="70"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 font-display text-white ml-3"
              style={{ fontSize: 22, paddingVertical: 10 }}
              accessibilityLabel="Your weight on Earth in kilograms"
            />
            <Text className="font-body-medium text-white/60" style={{ fontSize: 14 }}>
              kg on Earth
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {[...PLANETS, SUN].map((p) => (
              <View key={p.id} className="flex-row items-center rounded-2xl p-2.5 mb-2" style={{ width: '48.5%', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <PlanetOrb id={p.id} size={24} />
                <View className="ml-2.5">
                  <Text className="font-body text-white/55" style={{ fontSize: 11 }}>
                    {p.name}
                  </Text>
                  <Text className="font-display text-white" style={{ fontSize: 15 }}>
                    {validKg ? `${formatNumber((kg * p.gravity) / 9.8, 1)} kg` : '—'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Glass>
    </View>
  );
}

/* ------------------------------------------------------------------------- */
/* Quiz                                                                      */
/* ------------------------------------------------------------------------- */
const QUIZ_LENGTH = 8;

function haptic(success: boolean) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
}

function QuizSection() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(1)).current;

  const started = questions.length > 0;
  const finished = started && index >= questions.length;

  useEffect(() => {
    if (!started) return;
    Animated.timing(progress, { toValue: Math.min(index, questions.length) / questions.length, duration: 350, useNativeDriver: false }).start();
  }, [index, started, questions.length, progress]);

  const start = () => {
    tap();
    setQuestions(shuffle(QUIZ_QUESTIONS).slice(0, QUIZ_LENGTH));
    setIndex(0);
    setPicked(null);
    setScore(0);
    progress.setValue(0);
  };

  const choose = (i: number) => {
    if (picked !== null) return;
    const q = questions[index];
    setPicked(i);
    const ok = i === q.answer;
    haptic(ok);
    if (ok) setScore((s) => s + 1);
  };

  const next = () => {
    tap();
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }).start();
    if (index + 1 >= questions.length) setBest((b) => Math.max(b, score));
    setPicked(null);
    setIndex((x) => x + 1);
  };

  if (!started) {
    return (
      <View>
        <LinearGradient colors={['#2a2f7a', '#141838', '#0a0d22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 22 }}>
          <View className="flex-row">
            <PlanetOrb id="jupiter" size={46} />
            <View style={{ marginLeft: -12, marginTop: 18 }}>
              <PlanetOrb id="earth" size={28} />
            </View>
            <View style={{ marginLeft: -4, marginTop: 4 }}>
              <PlanetOrb id="mars" size={18} />
            </View>
          </View>
          <Text className="font-display text-white mt-4" style={{ fontSize: 26 }}>
            Solar System Quiz
          </Text>
          <Text className="font-body text-white/75 mt-2" style={{ fontSize: 14, lineHeight: 21 }}>
            {QUIZ_LENGTH} questions picked at random. Every answer comes with an explanation, so you learn as you play.
          </Text>
          <Pressable onPress={start} className="mt-5 rounded-2xl overflow-hidden">
            <LinearGradient colors={['#ffd27a', '#ff9a2e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center' }}>
              <Text className="font-body-semibold" style={{ color: '#1a0e00', fontSize: 15.5 }}>
                Start quiz
              </Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </View>
    );
  }

  if (finished) {
    const pct = score / questions.length;
    const verdict = pct === 1 ? 'Flawless! You’re a true astronomer.' : pct >= 0.75 ? 'Stellar work, space cadet!' : pct >= 0.5 ? 'Solid orbit — keep exploring.' : 'Every astronaut starts somewhere. Try again!';
    return (
      <View className="items-center">
        <View className="items-center justify-center rounded-full mt-4" style={{ width: 150, height: 150, borderWidth: 2, borderColor: '#7c8cff', backgroundColor: 'rgba(124,140,255,0.1)' }}>
          <Text className="font-display text-white" style={{ fontSize: 46 }}>
            {score}/{questions.length}
          </Text>
          <Text className="font-body text-white/55" style={{ fontSize: 12 }}>
            correct
          </Text>
        </View>
        <Text className="font-display text-white text-center mt-5" style={{ fontSize: 22 }}>
          {verdict}
        </Text>
        <Text className="font-body text-white/50 mt-1" style={{ fontSize: 13 }}>
          Best this session: {Math.max(best, score)}/{questions.length}
        </Text>
        <Pressable onPress={start} className="mt-6 rounded-2xl overflow-hidden self-stretch">
          <LinearGradient colors={['#7c8cff', '#5ee7ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center' }}>
            <Text className="font-body-semibold" style={{ color: '#060815', fontSize: 15.5 }}>
              Play again
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  const q = questions[index];
  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-body-medium text-white/60" style={{ fontSize: 12.5 }}>
          Question {index + 1} of {questions.length}
        </Text>
        <Text className="font-body-semibold" style={{ color: '#ffd27a', fontSize: 12.5 }}>
          Score {score}
        </Text>
      </View>
      <View className="h-1.5 rounded-full overflow-hidden mb-5" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <Animated.View style={{ height: '100%', backgroundColor: '#7c8cff', width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
      <Animated.View style={{ opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <Text className="font-display text-white mb-4" style={{ fontSize: 23, lineHeight: 29 }}>
          {q.question}
        </Text>
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const isPicked = i === picked;
          const revealed = picked !== null;
          let bg = 'rgba(255,255,255,0.05)';
          let border = 'rgba(255,255,255,0.1)';
          let icon: keyof typeof Ionicons.glyphMap | null = null;
          if (revealed && isAnswer) {
            bg = 'rgba(74,222,128,0.16)';
            border = '#4ade80';
            icon = 'checkmark-circle';
          } else if (revealed && isPicked) {
            bg = 'rgba(248,113,113,0.16)';
            border = '#f87171';
            icon = 'close-circle';
          }
          return (
            <Pressable key={opt} onPress={() => choose(i)} disabled={revealed} className="flex-row items-center rounded-2xl px-4 py-4 mb-2.5" style={{ backgroundColor: bg, borderWidth: 1, borderColor: border }}>
              <View className="w-7 h-7 rounded-full items-center justify-center mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <Text className="font-body-semibold text-white/80" style={{ fontSize: 12 }}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text className="flex-1 font-body-medium text-white" style={{ fontSize: 15 }}>
                {opt}
              </Text>
              {icon && <Ionicons name={icon} size={20} color={border} />}
            </Pressable>
          );
        })}
        {picked !== null && (
          <View>
            <Glass radius={18} style={{ marginTop: 6 }}>
              <View className="flex-row p-4">
                <Ionicons name={picked === q.answer ? 'sparkles' : 'book-outline'} size={18} color={picked === q.answer ? '#4ade80' : '#ffd27a'} />
                <Text className="flex-1 font-body text-white/85 ml-2.5" style={{ fontSize: 13.5, lineHeight: 20 }}>
                  {q.explanation}
                </Text>
              </View>
            </Glass>
            <Pressable onPress={next} className="mt-4 rounded-2xl overflow-hidden">
              <LinearGradient colors={['#7c8cff', '#5ee7ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 15, alignItems: 'center' }}>
                <Text className="font-body-semibold" style={{ color: '#060815', fontSize: 15.5 }}>
                  {index + 1 >= questions.length ? 'See results' : 'Next question'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </View>
  );
}
