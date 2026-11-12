# Northline Enhanced v4 — Glock GLB Edition

Northline is a browser FPS prototype using Three.js + PeerJS.

## Modes
- **Host TDM:** Create Room is TDM-only.
- **Quick Play:** public FFA room on Dustline.
- **Join Room:** joins the host's TDM room.

## Maps
- Dustline — original desert competitive FPS map with long, mid, tunnel, raised routes, courtyards, cover and spawn separation.
- Yard / Courtyard remain available in the codebase.

## Weapon
- `src/assets/glock-18.glb` is the supplied Glock 18 model.
- The supplied model is loaded through Three.js `GLTFLoader`.
- The old procedural pistol body is kept as a fallback while the GLB loads.
- Existing hand/arm animation, reload, recoil, muzzle flash and shooting behavior remain active.

## Combat visuals
- Bullet tracers
- Impact sparks
- Hitmarker/headshot feedback
- Kill feed
- Wall-occluded host hit registration

## Run
```bash
npm install
npm run dev
```

For Vercel, use the default Vite setup with the build command `npm run build` and output directory `dist`.
