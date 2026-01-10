# Codemap: Mini Warriors Reborn Overview

> A 2D lane-defense strategy game where players spawn units to destroy the enemy base while defending their own.

## Modules

| Module | Purpose | Codemap |
|--------|---------|---------|
| Core | Game initialization, scene management, input handling | `CODEMAP_CORE.md` |
| Units | Unit entities, AI state machines, combat system | `CODEMAP_UNITS.md` |
| Progression | Upgrades, unlocks, save/load, currency, stage definitions | `CODEMAP_PROGRESSION.md` |
| UI | HUD, menus, loadout selection, shop interfaces | `CODEMAP_UI.md` |
| Audio | Sound effects, music, audio pooling | `CODEMAP_AUDIO.md` |

## Module Dependencies (DAG)

| Module | Depends On | Depended On By |
|--------|------------|----------------|
| Core | — | Units, Progression, UI, Audio |
| Audio | Core | UI, Units |
| Progression | Core | Units, UI |
| Units | Core, Progression, Audio | UI |
| UI | Core, Progression, Units, Audio | — |

Implementation order: Core -> Audio -> Progression -> Units -> UI

## Data Flow

```
                    ┌─────────────┐
                    │    Core     │
                    │ (GameState) │
                    └──────┬──────┘
                           │ registry.get('gameState')
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ Progression│  │   Units    │  │   Audio    │
    │ (upgrades) │  │ (entities) │  │  (sounds)  │
    └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    ┌─────────────┐
                    │     UI      │
                    │   (HUD)     │
                    └─────────────┘
```

## User Workflows (WF)

| ID | Workflow | Modules Touched | Validates |
|----|----------|-----------------|-----------|
| WF-1 | Boot to menu | Core -> UI | Game initializes and reaches playable state |
| WF-2 | Play a stage | Core -> Progression -> Units -> UI -> Audio | Full battle loop works |
| WF-3 | Upgrade a unit | Core -> Progression -> UI | Upgrade system modifies unit stats |
| WF-4 | Unlock new unit | Core -> Progression -> UI | Stage completion triggers unlock |
| WF-5 | Save and resume | Core -> Progression | Progress persists across sessions |

## Integration Use Cases (IUC)

### IUC-1: Game boot and asset loading

**Modules:** Core -> Audio -> UI
**Module UCs:** UC-CORE-1, UC-AUDIO-1, UC-UI-1

**Given:** Fresh page load
**When:** Game initializes via BootScene -> PreloadScene
**Then:** All assets loaded, AudioManager ready, MenuScene displayed

**Acceptance:** `npm run dev && curl -s http://localhost:5173 | grep -q 'game'`

---

### IUC-2: Stage selection to battle start

**Modules:** Core -> Progression -> Units -> UI
**Module UCs:** UC-CORE-2, UC-PROG-1, UC-UNITS-1, UC-UI-2

**Given:** Player on LevelSelectScene with unlocked stages
**When:** Player selects stage and loadout, starts battle
**Then:** BattleScene loads with correct stage config and selected units

**Acceptance:** Manual test: select stage 1, pick Swordsman, verify unit spawns in battle

---

### IUC-3: Combat round with wave completion

**Modules:** Units -> Progression -> Audio -> UI
**Module UCs:** UC-UNITS-2, UC-UNITS-3, UC-PROG-2, UC-AUDIO-2, UC-UI-3

**Given:** BattleScene active with wave spawning enemies
**When:** Player units kill all enemies in wave
**Then:** Wave complete, gold awarded, next wave countdown begins, UI updates

**Acceptance:** Manual test: complete wave 1, verify gold increased and wave counter updated

---

### IUC-4: Battle victory with rewards

**Modules:** Units -> Progression -> Audio -> UI
**Module UCs:** UC-UNITS-4, UC-PROG-3, UC-AUDIO-3, UC-UI-4

**Given:** Final wave defeated, enemy base HP at 0
**When:** Victory condition triggers
**Then:** Stars calculated, gold/gems awarded, ResultsOverlay shown, progress saved

**Acceptance:** Manual test: destroy enemy base, verify victory screen shows correct stars

---

### IUC-5: Unit spawning with cooldown

**Modules:** Core -> Progression -> Units -> UI -> Audio
**Module UCs:** UC-CORE-3, UC-PROG-4, UC-UNITS-5, UC-UI-5, UC-AUDIO-2

**Given:** Player has gold, unit not on cooldown
**When:** Player taps spawn button
**Then:** Gold deducted, unit spawns, cooldown starts, SFX plays, UI reflects changes

**Acceptance:** Manual test: spawn Swordsman, verify gold decreases and button shows cooldown

---

### IUC-6: Upgrade purchase flow

**Modules:** Progression -> UI -> Audio
**Module UCs:** UC-PROG-5, UC-UI-6, UC-AUDIO-4

**Given:** Player on UpgradeScene with enough gold
**When:** Player purchases upgrade tier
**Then:** Gold deducted, upgrade applied to GameState, UI updates, save triggered

**Acceptance:** Manual test: buy Swordsman T1 offense, verify damage increased in next battle

---

### IUC-7: Save/load cycle

**Modules:** Core -> Progression
**Module UCs:** UC-CORE-4, UC-PROG-6

**Given:** Player has progress (stages cleared, upgrades purchased)
**When:** Page refresh
**Then:** All progress restored from localStorage

**Acceptance:** `localStorage.getItem('miniWarriorsSave') | jq '.highestStage'` returns saved value

---

### IUC-8: Pause and resume battle

**Modules:** Core -> Units -> UI -> Audio
**Module UCs:** UC-CORE-5, UC-UNITS-6, UC-UI-7, UC-AUDIO-5

**Given:** Battle in progress
**When:** Player taps pause button
**Then:** Game paused, PauseOverlay shown, audio paused, units frozen

**Acceptance:** Manual test: pause mid-battle, verify units stop moving

---

## Constants (Source of Truth)

### Unit IDs

| ID | Unit Name | Unlock Stage |
|----|-----------|--------------|
| `swordsman` | Swordsman | 1 (starter) |
| `archer` | Archer | 2 |
| `knight` | Knight | 4 |
| `mage` | Mage | 6 |
| `healer` | Healer | 8 |
| `assassin` | Assassin | 10 |
| `catapult` | Catapult | 12 |
| `griffin` | Griffin | 15 |
| `paladin` | Paladin | 18 |
| `dragon` | Dragon | 20 |

### Enemy IDs

| ID | Enemy Name | Introduced Stage |
|----|------------|------------------|
| `goblin` | Goblin | 1 |
| `warrior` | Warrior | 1 |
| `slinger` | Slinger | 3 |
| `brute` | Brute | 5 |
| `speedy` | Speedy | 6 |
| `rider` | Rider | 8 |
| `archer_enemy` | Archer | 11 |
| `wizard` | Wizard | 13 |
| `giant` | Giant | 10 |
| `harpy` | Harpy | 16 |
| `dinosaur` | Dinosaur | 18 |
| `dragon_rider` | Dragon Rider | 15 |

### AI Behaviors

| ID | Description | Units Using |
|----|-------------|-------------|
| `melee_aggressor` | Advance and attack | Swordsman, Assassin |
| `ranged_attacker` | Attack from range, retreat if rushed | Archer, Mage, Catapult |
| `support_caster` | Follow allies, heal/buff | Healer, Paladin |
| `flying_unit` | Ignore ground collision | Griffin, Dragon |
| `tank_unit` | Block enemy advance | Knight |

### Scene Keys

| Key | Scene Class |
|-----|-------------|
| `boot` | BootScene |
| `preload` | PreloadScene |
| `menu` | MenuScene |
| `levelSelect` | LevelSelectScene |
| `loadout` | LoadoutScene |
| `battle` | BattleScene |
| `upgrade` | UpgradeScene |
| `pauseOverlay` | PauseOverlay |
| `resultsOverlay` | ResultsOverlay |

### Upgrade Paths

| Path ID | Effect Per Tier |
|---------|-----------------|
| `offense` | T1: +15% DMG, T2: +25% DMG, T3: +40% DMG |
| `defense` | T1: +20% HP, T2: +35% HP, T3: +50% HP |
| `utility` | T1: -15% Cost, T2: -20% CD, T3: -25% Both |

### Castle Upgrades

| ID | Max Level | Effect/Level |
|----|-----------|--------------|
| `fortification` | 5 | +20% Base HP |
| `goldMine` | 5 | +0.5 gold/sec |
| `barracks` | 5 | -5% spawn cooldown |
| `armory` | 5 | +5% all unit damage |
| `infirmary` | 5 | +5% all unit HP |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `phaser` | `^3.88.0` | Game engine |
| `phaser3-rex-plugins` | `^1.80.0` | UI components (Rex UI) |
| `typescript` | `^5.0.0` | Type safety |
| `vite` | `^5.0.0` | Build tool with HMR |

**Dev dependencies:** vitest, @types/node

**Node:** >=18.0.0

---
<!-- PLACEMENT RULE: Only WF-N and IUC-N belong in this file.
     Module-specific use cases go in CODEMAP_{MODULE}.md as UC-{M}-N -->
