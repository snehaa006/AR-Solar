import React, { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Platform, StyleProp, View, ViewStyle } from 'react-native';

export interface GestureHandlers {
  onTap?: (x: number, y: number) => void;
  onDragStart?: () => void;
  /** Incremental movement in px since the last move event. */
  onDrag?: (dx: number, dy: number) => void;
  /** Release velocity in px/ms. */
  onDragEnd?: (vx: number, vy: number) => void;
  onPinchStart?: () => void;
  /** Scale relative to the distance between fingers when the pinch began. */
  onPinch?: (scale: number) => void;
  onPinchEnd?: () => void;
  /** Web mouse wheel / trackpad (deltaY in px). */
  onWheel?: (deltaY: number) => void;
}

type TouchPoint = { pageX: number; pageY: number };

function fingerDistance(touches: ArrayLike<TouchPoint>) {
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

/**
 * A transparent full-surface view translating raw touches into orbit / pinch /
 * tap intents. Implemented with PanResponder so it runs in Expo Go and on web.
 */
export function GestureLayer({ style, ...handlers }: GestureHandlers & { style?: StyleProp<ViewStyle> }) {
  const h = useRef(handlers);
  h.current = handlers;
  const viewRef = useRef<any>(null);

  const s = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    moved: false,
    mode: 'none' as 'none' | 'drag' | 'pinch',
    pinchStart: 1,
    lastDx: 0,
    lastDy: 0,
  });

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const st = s.current;
          st.startX = e.nativeEvent.locationX;
          st.startY = e.nativeEvent.locationY;
          st.startTime = Date.now();
          st.moved = false;
          st.mode = 'drag';
          st.lastDx = 0;
          st.lastDy = 0;
          h.current.onDragStart?.();
        },
        onPanResponderMove: (e, g) => {
          const st = s.current;
          const touches = e.nativeEvent.touches as unknown as TouchPoint[];
          if (touches && touches.length >= 2) {
            const d = fingerDistance(touches);
            if (st.mode !== 'pinch') {
              st.mode = 'pinch';
              st.pinchStart = Math.max(d, 1);
              st.moved = true;
              h.current.onPinchStart?.();
            } else {
              h.current.onPinch?.(d / st.pinchStart);
            }
            return;
          }
          if (st.mode === 'pinch') return; // ignore the leftover finger until release
          const ddx = g.dx - st.lastDx;
          const ddy = g.dy - st.lastDy;
          st.lastDx = g.dx;
          st.lastDy = g.dy;
          if (Math.abs(g.dx) + Math.abs(g.dy) > 7) st.moved = true;
          if (st.moved) h.current.onDrag?.(ddx, ddy);
        },
        onPanResponderRelease: (_, g) => {
          const st = s.current;
          if (!st.moved && Date.now() - st.startTime < 450) {
            h.current.onTap?.(st.startX, st.startY);
            h.current.onDragEnd?.(0, 0);
          } else if (st.mode === 'pinch') {
            h.current.onPinchEnd?.();
            h.current.onDragEnd?.(0, 0);
          } else {
            h.current.onDragEnd?.(g.vx, g.vy);
          }
          st.mode = 'none';
        },
        onPanResponderTerminate: () => {
          const st = s.current;
          if (st.mode === 'pinch') h.current.onPinchEnd?.();
          h.current.onDragEnd?.(0, 0);
          st.mode = 'none';
        },
      }),
    [],
  );

  // Mouse-wheel zoom for the web build.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = viewRef.current as unknown as HTMLElement | null;
    if (!node || !node.addEventListener) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      h.current.onWheel?.(ev.deltaY);
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  return <View ref={viewRef} style={style} {...responder.panHandlers} />;
}
