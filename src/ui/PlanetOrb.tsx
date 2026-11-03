import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { BODY_BY_ID, BodyId } from '../data/planets';

export const ORB_IMAGES: Record<BodyId, ImageSourcePropType> = {
  sun: require('../../assets/textures/sun.jpg'),
  mercury: require('../../assets/textures/mercury.jpg'),
  venus: require('../../assets/textures/venus.jpg'),
  earth: require('../../assets/textures/earth.jpg'),
  mars: require('../../assets/textures/mars.jpg'),
  jupiter: require('../../assets/textures/jupiter.jpg'),
  saturn: require('../../assets/textures/saturn.jpg'),
  uranus: require('../../assets/textures/uranus.jpg'),
  neptune: require('../../assets/textures/neptune.jpg'),
};

/**
 * A small shaded "planet" made from the real surface texture — used across the UI.
 */
export function PlanetOrb({ id, size, glow = false }: { id: BodyId; size: number; glow?: boolean }) {
  const body = BODY_BY_ID[id];
  const isSun = id === 'sun';
  const ring = id === 'saturn';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: body.color,
        shadowOpacity: glow || isSun ? 0.9 : 0,
        shadowRadius: size * 0.35,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: body.color,
        }}
      >
        <Image
          source={ORB_IMAGES[id]}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: -size * 0.45, width: size * 2, height: size }}
        />
        {isSun ? (
          <LinearGradient
            colors={['rgba(255,240,200,0.35)', 'rgba(255,170,60,0)', 'rgba(255,90,0,0.35)']}
            start={{ x: 0.2, y: 0.15 }}
            end={{ x: 0.9, y: 0.95 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.82)']}
            locations={[0, 0.42, 1]}
            start={{ x: 0.12, y: 0.08 }}
            end={{ x: 0.95, y: 0.95 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      {ring && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size * 1.9,
            height: size * 0.46,
            borderRadius: size,
            borderWidth: Math.max(1.5, size * 0.07),
            borderColor: 'rgba(232,214,170,0.75)',
            transform: [{ rotate: '-16deg' }],
          }}
        />
      )}
    </View>
  );
}
