# Codemap: Mini Warriors Reborn

> 2D lane-defense strategy game built with Phaser 3 and TypeScript. Players spawn units to destroy the enemy base while defending their own across 20 campaign stages.

## Architecture

```
index.html → src/main.ts → src/config.ts (scene registration)
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              src/scenes/   src/managers/  src/data/
              (game flow)   (singletons)  (static defs)
                    │            │
                    ▼            ▼
              src/systems/  src/entities/  src/units/
              (combat,      (bases,        (Unit, AI,
               spawning,     turrets,       player/enemy
               economy)      gold mines)    factories)
                    │
                    ▼
               src/ui/
              (HUD, buttons, spawn bar, upgrade tree)
```

Singletons (`GameState`, `AudioManager`) live in the Phaser registry and are accessed via `scene.registry.get()`.

## Key Files

### Entry & Config

| File | Lines | Responsibility |
|------|-------|----------------|
| `src/main.ts` | 18 | Creates Phaser game instance on window load |
| `src/config.ts` | 31 | Phaser config: canvas size, physics, scene list |
| `src/constants.ts` | 3 | `GAME_WIDTH=1280`, `GAME_HEIGHT=720` |

### Data (static definitions)

| File | Lines | Exports | Responsibility |
|------|-------|---------|----------------|
| `src/data/units.ts` | 168 | `UNIT_DEFINITIONS`, `UNIT_IDS`, `getUnlockedUnits()` | 10 player units: swordsman→dragon, stats, unlock stages, flags (isTank, isFlying, isHealer, splashRadius) |
| `src/data/enemies.ts` | 157 | `ENEMY_DEFINITIONS`, `EnemyDefinition`, `WaveDefinition` | 12 enemy types: goblin→demon_lord, stats, isFlying flag |
| `src/data/stages.ts` | 440 | `STAGE_DEFINITIONS`, `getStage()`, `calculateStars()` | 20 stages + endless mode, wave composition, multipliers, rewards, unit unlocks |
| `src/data/animations.ts` | 222 | `UNIT_ANIMATIONS`, `ENEMY_ANIMATIONS`, `ENEMY_SPRITE_MAP` | Spritesheet frame layouts (16-24 frame variants), enemy→sprite file mapping |
| `src/data/upgrades.ts` | 179 | `UPGRADE_PATHS`, `CASTLE_UPGRADES`, multiplier helpers | Unit upgrades (offense/defense/utility × 3 tiers), castle upgrades (5 types × 5 levels) |
| `src/data/turrets.ts` | 74 | `TURRET_TIERS`, costs, `getTurretTier()` | 3 turret tiers (pebble, arrow, cannonball), purchase/upgrade costs |
| `src/data/audio.ts` | 81 | `SFX_KEYS`, `MUSIC_KEYS` | Sound effect and music key definitions with pooling limits |

### Managers (singletons via registry)

| File | Lines | Exports | Responsibility |
|------|-------|---------|----------------|
| `src/managers/GameState.ts` | 302 | `GameState` class | Progression (stages, stars), currencies (gold, gems), unlocked units, upgrades, settings, stats |
| `src/managers/AudioManager.ts` | 373 | `AudioManager` class | Music and SFX playback, browser audio unlock, sound pooling, crossfade, volume control |
| `src/managers/SaveManager.ts` | 81 | `SaveManager` class | localStorage persistence with schema versioning and migration |

### Scenes (game flow)

| File | Lines | Responsibility |
|------|-------|----------------|
| `src/scenes/BootScene.ts` | 16 | Immediately transitions to PreloadScene |
| `src/scenes/PreloadScene.ts` | 286 | Asset loading (sprites, BG, UI, audio), animation creation, GameState/AudioManager init |
| `src/scenes/MenuScene.ts` | 183 | Main menu: animated title, parallax BG, ambient particles, play button |
| `src/scenes/LevelSelectScene.ts` | 348 | 4×5 world grid (Forest/Castle/Graveyard/Volcano), stars, locks, tooltips |
| `src/scenes/LoadoutScene.ts` | 125 | Pre-battle unit selection (max 5 from unlocked roster) |
| `src/scenes/BattleScene.ts` | 898 | Main battle loop: unit spawning, combat, waves, economy, turrets, mines, HUD, win/lose |
| `src/scenes/UpgradeScene.ts` | 663 | Unit and castle upgrade purchase UI with tabs and confirmation dialogs |
| `src/scenes/overlays/PauseOverlay.ts` | 656 | Pause menu: volume slider, fullscreen, settings, resume/quit |
| `src/scenes/overlays/ResultsOverlay.ts` | 482 | Victory (confetti, star fill, gold count) / Defeat (fade, encouragement) |

### Systems (battle mechanics)

| File | Lines | Exports | Responsibility |
|------|-------|---------|----------------|
| `src/systems/WaveManager.ts` | 220 | `WaveManager` class | Wave spawning, kill tracking, audio announcements, completion callbacks |
| `src/systems/CombatSystem.ts` | 36 | `calculateDamage()`, `processAttack()` | Damage calculation (currently raw damage, designed for future armor/buffs) |
| `src/systems/Projectile.ts` | 106 | `Projectile` class | Ranged attack projectile with splash damage support |
| `src/systems/TurretProjectile.ts` | 60 | `TurretProjectile` class | Simpler turret-fired projectile (fixed damage, no splash) |
| `src/systems/DragonSpawner.ts` | 98 | `DragonSpawner` class | Flying dragon spawning during battle (stages 10+) |
| `src/systems/EconomyManager.ts` | 149 | `EconomyManager` class, `calculateRewards()` | Battle gold, kill rewards, time bonuses, passive income |
| `src/systems/UpgradeManager.ts` | 127 | `UpgradeManager` class | Purchase validation, stat modifier calculation from upgrades |
| `src/systems/TransitionManager.ts` | 150 | `TransitionManager` class | Scene transitions: fade, slideLeft, slideRight, zoom |

### Entities (battlefield objects)

| File | Lines | Exports | Responsibility |
|------|-------|---------|----------------|
| `src/entities/Base.ts` | 209 | `Base` class | Castle base with visual damage states (healthy→burning→crumbling→rubble) |
| `src/entities/Turret.ts` | 198 | `Turret` class | Player turret, 3 upgradeable tiers, tier stars, interactive upgrade button |
| `src/entities/EnemyTurret.ts` | 109 | `EnemyTurret` class | Enemy turret (stage 20), fixed cannonball tier, auto-targets player units |
| `src/entities/GoldMine.ts` | 91 | `GoldMine` class | Tappable mine: weighted gold drops (76%→2g, 10%→1g, 9%→5g, 5%→50g jackpot) |

### Units (combat entities + AI)

| File | Lines | Exports | Responsibility |
|------|-------|---------|----------------|
| `src/units/Unit.ts` | 393 | `Unit` class | Base unit: HP, sprite, state machine, attack/heal logic, flying bob, death anim |
| `src/units/StateMachine.ts` | 109 | `StateMachine` class, `UnitState` enum | AI states: Moving, Attacking, Holding (tanks), Healing, Dying |
| `src/units/PlayerUnit.ts` | 154 | `PlayerUnit`, `createPlayerUnit()` | Factory applies unit + castle upgrades to base stats |
| `src/units/EnemyUnit.ts` | 88 | `EnemyUnit`, `createEnemyUnit()` | Factory applies stage HP/damage multipliers, emits gold/kill events |

### UI Components

| File | Lines | Exports | Responsibility |
|------|-------|---------|----------------|
| `src/ui/theme.ts` | 174 | `THEME` constant | Colors, typography, animation timings, spacing, depth layers |
| `src/ui/Button.ts` | 267 | `Button` class | 3-tier button (primary/secondary/tertiary) with hover/press/disabled states |
| `src/ui/HUD.ts` | 281 | `HUD` class | Battle HUD: gold, wave counter, base HP bars, floating feedback |
| `src/ui/SpawnBar.ts` | 279 | `SpawnBar` class | Bottom spawn buttons: costs, cooldown circles, affordability states |
| `src/ui/LoadoutGrid.ts` | 333 | `LoadoutGrid` class | Unit selection grid for pre-battle (max 5 slots), stat tooltips |
| `src/ui/UpgradeTree.ts` | 261 | `UpgradeTree` class | 3-path upgrade tree: offense/defense/utility × 3 tiers |
| `src/ui/HealthBar.ts` | 53 | `HealthBar` class | Unit health bar (green→red below 30%) |
| `src/ui/DamageNumbers.ts` | 33 | `showDamageNumber()` | Floating red "-X" that rises and fades |

## Data Flow

```
GameState (registry singleton)
    │ loadFromStorage() on boot
    │
    ├──► LevelSelectScene reads stageProgress/stars
    ├──► LoadoutScene reads unlockedUnits
    ├──► BattleScene reads loadout + upgrades
    │       │
    │       ├──► createPlayerUnit() applies upgrades to base stats
    │       ├──► createEnemyUnit() applies stage multipliers
    │       ├──► WaveManager spawns enemies per stage definition
    │       ├──► EconomyManager tracks gold earned/spent
    │       └──► calculateRewards() → GameState.completeStage()
    │
    ├──► UpgradeScene reads/writes upgrades via UpgradeManager
    └──► SaveManager.save() on every state change
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `phaser` 3.90 | Game engine (rendering, physics, input, audio) |
| `phaser3-rex-plugins` 1.80 | Sound fade utility for music crossfade |
| `jsfxr` 1.3 | Programmatic SFX generation |
| `sharp` (dev) | Image processing for sprite conversion scripts |

## Common Tasks

| Task | How |
|------|-----|
| Add a player unit | Add entry to `src/data/units.ts:UNIT_DEFINITIONS`, sprite to `public/assets/sprites/units/`, animation config to `src/data/animations.ts:UNIT_ANIMATIONS` |
| Add an enemy | Add entry to `src/data/enemies.ts:ENEMY_DEFINITIONS`, sprite to `public/assets/sprites/enemies/`, animation config + sprite mapping to `src/data/animations.ts` |
| Add a stage | Add entry to `src/data/stages.ts:STAGE_DEFINITIONS` with wave composition and multipliers |
| Modify upgrade costs | Edit tiers in `src/data/upgrades.ts:UPGRADE_PATHS` or `CASTLE_UPGRADES` |
| Change turret stats | Edit `src/data/turrets.ts:TURRET_TIERS` |

## Assets

```
public/assets/
├── sprites/
│   ├── units/          # Player unit spritesheets (horizontal, 64px frames)
│   ├── enemies/        # Enemy spritesheets (horizontal, 64px frames)
│   ├── castle_player.png
│   └── castle_enemy.png
├── audio/
│   ├── music/          # Background tracks
│   └── sfx/            # Sound effects (.wav)
└── ui/                 # Buttons, panels, icons

assets/                 # Raw PixelLab output (ZIPs, individual frames)
├── demon_lord/         # Reference: working PixelLab→spritesheet pipeline
└── sprites/            # Intermediate sprite files
```

Spritesheet format: single horizontal PNG, 64px × (frames × 64px), layout `[idle][walk][attack][death]`.
