# SOLARIS: AR Solar System Explorer

SOLARIS is a 3D and AR Solar System explorer built with **Expo (SDK 58)**, **React Native**, **TypeScript**, **Three.js**, **React Three Fiber** and **Tailwind (NativeWind)**. Every native module it uses ships with **Expo Go**, so it runs on an iPhone without a custom build.

## Features

| | |
|---|---|
| **Explore (3D)** | The Sun and all 8 planets with real NASA-derived textures. Planet positions are computed from orbital elements for today's date. Each planet spins on its real axial tilt (Venus and Uranus spin retrograde). You also get Earth's clouds and Moon, Saturn's rings, fresnel atmospheres, an animated asteroid belt, a Milky Way skybox and a starfield. |
| **Navigation** | Drag to orbit, pinch to zoom, tap a planet or its label. Camera fly-throughs follow moving planets. A planet carousel, prev/next buttons and an Overview reset help you get around. Time can run at 1 day/s up to 1 year/s, can be paused, and can jump back to today. |
| **Planet info** | A bottom sheet (peek or full) shows diameter, distance from the Sun, moons, day and year length, gravity, temperature, mass and axial tilt, plus a set of facts for each planet. |
| **AR view** | The camera feed with the 3D Solar System anchored in your room. The phone's gyroscope tracks rotation (3DoF). Aim, tap to place, then turn around it. Pinch to resize, drag to spin, tap planets for info. Re-place at any time. |
| **Graceful fallback** | No camera permission or no camera: **3D Tabletop** mode. No motion data (desktop, simulator): touch-controlled AR. Web over plain http: tabletop mode. |
| **Discover** | Fact of the day plus a fact feed. Planet comparisons across 8 metrics with animated charts. A true-scale size lineup. A "your weight on other worlds" calculator. A randomized 8-question quiz with explanations and scoring. |
| **Polish** | Cinematic loading screen with texture progress, frosted-glass UI, Space Grotesk + Inter typography, haptics, safe-area aware and mobile-first. |

## Run it on your iPhone (Expo Go)

1. Install **Expo Go** from the App Store on the iPhone. It must be a version that supports **SDK 58**; the current App Store build does.
2. On your computer (Node 20+), run:

   ```bash
   git clone https://github.com/snehaa006/AR-Solar.git
   ```

   ```bash
   cd AR-Solar
   ```

   ```bash
   npm install
   ```

   ```bash
   npx expo start
   ```

3. Put the iPhone and the computer on the **same Wi‑Fi network**. Open the iPhone **Camera** app and scan the QR code shown in the terminal, then tap the banner to open SOLARIS in Expo Go.
   - If the phone can't reach your computer (guest Wi‑Fi, VPN, corporate network), use a tunnel instead:

     ```bash
     npx expo start --tunnel
     ```

4. The first load takes a few seconds while the bundle and textures download.

### What to test on the iPhone

- **Explore tab**: drag to orbit and pinch to zoom. Tap Earth, which flies the camera in and opens the sheet. Drag the sheet handle up for full details. Use the ‹ › buttons to hop between planets, and try the speed and pause buttons.
- **AR View tab**: tap **Start AR** and allow **Camera** and **Motion** access. Point at the floor or a desk and tap to place the system. Walk around it by turning the phone, pinch to resize, and tap a planet. The crosshair button re-places the system.
- **AR fallback**: deny camera access (or later disable it in *Settings → Expo Go*) and start AR again. SOLARIS switches to the 3D Tabletop view with an explanation.
- **Discover tab**: try Facts, Compare (switch metrics and change your weight) and the Quiz.

### About AR in Expo Go

Expo Go cannot load ARKit or ARCore native modules, so SOLARIS uses camera passthrough with a transparent expo-gl layer, driven by the device-motion sensors. This tracks **rotation (3DoF)**: the system stays put as you turn and tilt the phone, but it does not track walking toward it. Use pinch to change its size instead. Full 6DoF plane-anchored AR would need a development build (`expo-dev-client` plus an ARKit library), which is outside what Expo Go allows.

## Other ways to run it

```bash
npx expo start --web
```

`npx expo start --web` runs the browser build. 3D, Discover and tabletop work. Camera AR in a browser needs HTTPS and a phone.

```bash
npm run typecheck
```

`npm run typecheck` runs the TypeScript checks.

```bash
npm run export
```

`npm run export` builds the production iOS and Android bundles (Hermes).

```bash
npx expo-doctor
```

`npx expo-doctor` checks the dependency and config setup.

## Project structure

```
App.tsx                  fonts, texture preload, tabs, splash
src/data/                planets.ts (NASA data + orbital maths), discover.ts (facts, quiz)
src/three/               SolarSystem (Sun, planets, rings, atmospheres, belt, stars),
                         CameraRig (orbit camera + fly-to), LabelProjector, sim, textures
src/ar/                  ARScene (gyro / touch / tabletop rigs), motion (device attitude → camera)
src/screens/             Explore, AR, Discover, Loading
src/ui/                  PlanetSheet, TabBar, GestureLayer, Labels, PlanetOrb, Glass
assets/textures/         planet, ring, moon and Milky Way maps
```

## Credits

- Planet, Sun, Moon, Saturn ring and Milky Way textures: **[Solar System Scope](https://www.solarsystemscope.com/textures/)**, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). They are based on NASA imagery and were resized for mobile.
- Physical and orbital data: NASA Planetary Fact Sheet. Mean longitudes: JPL *Approximate Positions of the Planets*. Moon counts: NASA Science.
- Fonts: Space Grotesk and Inter (SIL Open Font License) via `@expo-google-fonts`.

The 3D sizes and distances are compressed so that every planet fits on a phone screen. All numbers shown in the UI are real.
