# Codemap: Core Module

> Game initialization, Phaser configuration, scene management, GameState, and input handling.

## Placement Rule

A use case belongs in THIS file if:
- It involves ONLY Core module (config, scenes, state, input)
- It can be tested by mocking inputs/outputs at module boundary
- It has clear contract: input -> Core -> output

If a UC spans multiple modules -> put it in CODEMAP_OVERVIEW.md as IUC-N.

## Key Files

| File | Responsibility |
|------|----------------|
| `src/main.ts` | Entry point, Phaser game instantiation |
| `src/config.ts` | Phaser.Types.Core.GameConfig |
| `src/scenes/BootScene.ts` | Minimal load, loading bar display |
| `src/scenes/PreloadScene.ts` | Asset loading, manager initialization |
| `src/scenes/MenuScene.ts` | Main menu UI |
| `src/scenes/LevelSelectScene.ts` | World/stage grid |
| `src/scenes/LoadoutScene.ts` | Pre-battle unit selection |
| `src/scenes/BattleScene.ts` | Core gameplay loop |
| `src/scenes/UpgradeScene.ts` | Between-battle shop |
| `src/scenes/overlays/PauseOverlay.ts` | Pause menu |
| `src/scenes/overlays/ResultsOverlay.ts` | Victory/defeat screen |
| `src/managers/GameState.ts` | Persistent game state |

## Public API

| Function/Class | Signature | Purpose |
|----------------|-----------|---------|
| `createGame` | `() => Phaser.Game` | Initialize Phaser with config |
| `GameState` | `class` | Singleton holding all persistent data |
| `GameState.getInstance` | `(scene: Phaser.Scene) => GameState` | Get state from registry |
| `GameState.save` | `() => void` | Persist to localStorage |
| `GameState.load` | `() => GameState` | Restore from localStorage |
| `InputManager` | `class` | Unified touch/keyboard handling |

## Key Types

```typescript
interface GameConfig {
  width: number;           // 1280
  height: number;          // 720
  parent: string;          // 'game-container'
  scale: {
    mode: Phaser.Scale.FIT;
    autoCenter: Phaser.Scale.CENTER_BOTH;
  };
  physics: {
    default: 'arcade';
    arcade: { debug: boolean };
  };
}

interface GameState {
  version: number;
  currentStage: number;
  highestStage: number;
  stageStars: Record<number, number>;  // stageId -> 0-3
  gold: number;
  gems: number;
  totalGoldEarned: number;
  unlockedUnits: string[];
  unitUpgrades: Record<string, UnitUpgrades>;
  castleUpgrades: CastleUpgrades;
  unlockedAbilities: string[];
  settings: GameSettings;
  stats: PlayerStats;
}

interface UnitUpgrades {
  offense: number;  // 0-3
  defense: number;  // 0-3
  utility: number;  // 0-3
}

interface CastleUpgrades {
  fortification: number;  // 0-5
  goldMine: number;
  barracks: number;
  armory: number;
  infirmary: number;
}

interface GameSettings {
  musicVolume: number;  // 0-1
  sfxVolume: number;    // 0-1
  fullscreen: boolean;
}

interface PlayerStats {
  totalBattles: number;
  totalVictories: number;
  totalUnitsSpawned: number;
  totalEnemiesKilled: number;
  totalPlayTime: number;
}

interface BattleState {
  stageId: number;
  loadout: string[];
  gold: number;
  currentWave: number;
  totalWaves: number;
  waveEnemiesRemaining: number;
  playerBaseHP: number;
  playerBaseMaxHP: number;
  enemyBaseHP: number;
  enemyBaseMaxHP: number;
  battleStartTime: number;
  elapsedTime: number;
  isPaused: boolean;
  isOver: boolean;
  result: 'pending' | 'victory' | 'defeat';
}

interface SceneTransitionData {
  stageId?: number;
  loadout?: string[];
  result?: 'victory' | 'defeat';
  stars?: number;
  rewards?: { gold: number; gems: number };
}
```

## Module Use Cases (UC-CORE)

### UC-CORE-1: Initialize Phaser game

**Participates in:** IUC-1 (Game boot and asset loading)
**Touches:** `main.ts`, `config.ts`
**Depends:** none

**Given:** HTML page with `<div id="game-container">`
**When:** `main.ts` executes
**Then:** Phaser.Game created with correct config, BootScene starts

**Contract:**
- Input: DOM element with id `game-container`
- Output: Running Phaser.Game instance
- Errors: Console error if container not found

**Acceptance:** `npm run dev` opens browser with loading screen visible

---

### UC-CORE-2: Scene transitions with data

**Participates in:** IUC-2 (Stage selection to battle start)
**Touches:** All scene files
**Depends:** UC-CORE-1

**Given:** Player on any scene
**When:** Scene transition triggered (e.g., start battle)
**Then:** Target scene receives transition data via `scene.start(key, data)`

**Contract:**
- Input: `scene.start('battle', { stageId: 1, loadout: ['swordsman'] })`
- Output: BattleScene.init receives { stageId, loadout }
- Errors: Missing data causes default values

**Acceptance:** Log `init(data)` in BattleScene, verify stageId present

---

### UC-CORE-3: Input handling for spawning

**Participates in:** IUC-5 (Unit spawning with cooldown)
**Touches:** `BattleScene.ts`, `InputManager.ts` (if extracted)
**Depends:** UC-CORE-1

**Given:** BattleScene active
**When:** Player taps spawn button or presses keyboard shortcut (1-5)
**Then:** Spawn event emitted with unit ID

**Contract:**
- Input: Pointer down on button OR key press
- Output: Event `'spawn-unit'` with `{ unitId: string }`
- Errors: Ignore input if game paused

**Acceptance:** Console log on spawn input, verify fires for both touch and keyboard

---

### UC-CORE-4: GameState persistence

**Participates in:** IUC-7 (Save/load cycle)
**Touches:** `GameState.ts`
**Depends:** UC-CORE-1

**Given:** GameState with player progress
**When:** `gameState.save()` called
**Then:** State serialized to localStorage key `miniWarriorsSave`

**Contract:**
- Input: GameState object
- Output: JSON string in localStorage
- Errors: Graceful failure if storage full (log warning)

**Acceptance:** `localStorage.getItem('miniWarriorsSave')` returns valid JSON

---

### UC-CORE-5: Pause game state

**Participates in:** IUC-8 (Pause and resume battle)
**Touches:** `BattleScene.ts`, `PauseOverlay.ts`
**Depends:** UC-CORE-1, UC-CORE-2

**Given:** BattleScene active, battle in progress
**When:** Pause triggered (button or Escape key)
**Then:** Physics paused, tweens paused, PauseOverlay launched

**Contract:**
- Input: Pause input event
- Output: `scene.launch('pauseOverlay')`, `scene.physics.pause()`
- Errors: None expected

**Acceptance:** Pause mid-battle, verify units frozen, overlay visible

---

### UC-CORE-6: Resume from pause

**Participates in:** IUC-8 (Pause and resume battle)
**Touches:** `PauseOverlay.ts`, `BattleScene.ts`
**Depends:** UC-CORE-5

**Given:** Game paused with PauseOverlay visible
**When:** Resume button pressed
**Then:** Overlay closed, physics resumed, battle continues

**Contract:**
- Input: Resume button click
- Output: `scene.stop('pauseOverlay')`, `scene.physics.resume()`
- Errors: None expected

**Acceptance:** Resume from pause, verify units moving again

---

### UC-CORE-7: Responsive scaling

**Participates in:** standalone
**Touches:** `config.ts`
**Depends:** UC-CORE-1

**Given:** Game running on various screen sizes
**When:** Window resized or orientation changed
**Then:** Game scales to fit while maintaining aspect ratio

**Contract:**
- Input: Window resize event
- Output: Canvas scaled, centered
- Errors: None expected

**Acceptance:** Resize browser window, verify game scales without distortion

---

### UC-CORE-8: Load saved game on boot

**Participates in:** IUC-7 (Save/load cycle)
**Touches:** `PreloadScene.ts`, `GameState.ts`
**Depends:** UC-CORE-1

**Given:** localStorage contains `miniWarriorsSave`
**When:** PreloadScene.create() runs
**Then:** GameState restored from save, placed in registry

**Contract:**
- Input: JSON from localStorage
- Output: GameState object in `game.registry`
- Errors: If parse fails, create fresh GameState

**Acceptance:** Save game, refresh page, verify highestStage preserved

---

## Internal Data Flow

```
main.ts
   │ new Phaser.Game(config)
   ▼
BootScene.create()
   │ show loading bar
   │ scene.start('preload')
   ▼
PreloadScene.preload()
   │ load all assets
   │ GameState.load() or new
   │ registry.set('gameState', state)
   ▼
PreloadScene.create()
   │ scene.start('menu')
   ▼
MenuScene ──► LevelSelectScene ──► LoadoutScene ──► BattleScene
                                                        │
                                        ┌───────────────┼────────────┐
                                        ▼               ▼            ▼
                                  PauseOverlay   ResultsOverlay   UpgradeScene
```

## Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Registry for globals | Cross-scene data | `this.registry.get('gameState')` |
| Scene data passing | Transition-specific data | `scene.start('battle', { stageId })` |
| Overlay scenes | Modal UI | `scene.launch('pauseOverlay')` |
| Event emitter | Decouple systems | `this.events.emit('spawn-unit', id)` |

## Dependencies

| This Module Uses | Used By |
|------------------|---------|
| Phaser 3 | Units, Progression, UI, Audio |

## Common Tasks

| Task | Solution |
|------|----------|
| Add new scene | Create class extending `Phaser.Scene`, add to scene array in `config.ts` |
| Access GameState | `const state = this.registry.get('gameState') as GameState` |
| Save progress | `GameState.getInstance(this).save()` |
| Pass data to scene | `this.scene.start('target', { key: value })` |
| Pause all | `this.scene.pause('battle'); this.physics.pause()` |

## Gotchas

**Audio unlock:** Must handle `scene.sound.locked` and wait for user interaction before playing audio.

**Registry typing:** Always cast `registry.get()` results: `as GameState`.

**Scene key mismatch:** Scene keys in config must match strings used in `scene.start()`.

**Mobile scaling:** Test on real devices; browser dev tools don't perfectly simulate touch.

---
<!-- PLACEMENT RULE: Only UC-CORE-N belong in this file.
     Cross-module flows go in CODEMAP_OVERVIEW.md as IUC-N -->
