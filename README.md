# 🏀 UBG (Untitled Basketball Game) - Command Dashboard

## ⚙️ Tech Stack (Locked)
*   **Logic & Physics:** TypeScript
*   **Rendering Engine:** Three.js / React Three Fiber
*   **Frontend UI:** React (Next.js)
*   **Asset Pipeline:** Blender -> glTF

## 🗺️ Roadmap & Progress
*   [x] **Phase 1: Reconnaissance** - Deconstruct 1993 Midway Assembly source (MAIN, BB, PLYR, DRN).
*   [x] **Phase 2: Architecture Strategy** - Define the web-native tech stack (React + Three.js).
*   [ ] **Phase 3: Repository Setup** - Initialize Git tracking and connect to GitHub.
*   [ ] **Phase 4: Engine Foundation** - Build `GameLoop`, `GameStateManager`, and `InputController` in TS.
*   [ ] **Phase 5: Core Mechanics Port** - Translate `calcshot`, movement, and collision math from ASM to TS.
*   [ ] **Phase 6: Object Model** - Setup `PlayerProcess`, `BallProcess`, `DroneAIProcess` objects.
*   [ ] **Phase 7: Visuals & UI** - Connect 3D models via Three.js and build React HUD.

## 📡 Active Directive
*   Begin coding the engine scaffold and prototype game loop.

## ✅ Latest Build Progress
- Initialized a modern web-native engine scaffold using **TypeScript + React + Three.js (R3F)**.
- Added core runtime classes:
  - `GameLoop` (fixed-step 60hz simulation loop)
  - `GameStateManager` (authoritative game state + ball integration)
  - `InputController` (keyboard input layer)
- Added playable prototype scene with HUD and gameplay decision hooks.
- Implemented first-pass gameplay pipeline:
  - Shot success evaluation (`evaluateShot`)
  - Dunk decision evaluation (`evaluateDunk`)
  - Inbound transition state machine (`startInbound` / `stepInbound`)
- Added keyboard gameplay controls:
  - `S` = Shot attempt
  - `D` = Dunk attempt

## 🚀 Run Local
```bash
npm install
npm run dev
```