# Codemap: Progression Module

> Upgrade system, unlock system, save/load, currency management, and stage/level definitions.

## Placement Rule

A use case belongs in THIS file if:
- It involves ONLY Progression module (upgrades, unlocks, save, stages)
- It can be tested by mocking GameState
- It has clear contract: input -> Progression -> output

If a UC spans multiple modules -> put it in CODEMAP_OVERVIEW.md as IUC-N.

## Key Files

| File | Responsibility |
|------|----------------|
| `src/managers/SaveManager.ts` | localStorage read/write, migration |
| `src/systems/UpgradeManager.ts` | Upgrade logic, cost calculation |
| `src/systems/EconomyManager.ts` | Gold/gem income, spending |
| `src/data/stages.ts` | Stage definitions with waves |
| `src/data/upgrades.ts` | Upgrade tree definitions |

## Public API

| Function/Class | Signature | Purpose |
|----------------|-----------|---------|
| `SaveManager` | `class` | Persist/restore GameState |
| `SaveManager.save` | `(state: GameState) => void` | Write to localStorage |
| `SaveManager.load` | `() => GameState \| null` | Read from localStorage |
| `UpgradeManager` | `class` | Upgrade purchase and application |
| `UpgradeManager.canAfford` | `(upgradeId, tier) => boolean` | Check gold requirement |
| `UpgradeManager.purchase` | `(upgradeId, tier) => boolean` | Buy upgrade |
| `UpgradeManager.getModifiers` | `(unitId) => StatModifiers` | Get upgrade multipliers |
| `EconomyManager` | `class` | Currency tracking |
| `EconomyManager.addGold` | `(amount) => void` | Award gold |
| `EconomyManager.spendGold` | `(amount) => boolean` | Deduct if affordable |
| `getStage` | `(stageId) => StageDefinition` | Get stage config |
| `calculateStars` | `(result, baseHP, time, targetTime) => number` | Star rating |

## Key Types

```typescript
interface SaveData {
  version: number;  // For migrations
  state: GameState;
  timestamp: number;
}

const SAVE_KEY = 'miniWarriorsSave';
const CURRENT_VERSION = 1;

interface UpgradeDefinition {
  id: string;          // 'swordsman_offense', 'castle_fortification'
  targetType: 'unit' | 'castle';
  targetId: string;    // unit ID or castle upgrade ID
  path: 'offense' | 'defense' | 'utility' | null;  // null for castle
  tier: number;
  cost: number;
  effect: UpgradeEffect;
}

interface UpgradeEffect {
  stat: 'damage' | 'hp' | 'cost' | 'cooldown' | 'baseHp' | 'goldPerSec' | 'spawnCooldown';
  modifier: number;    // Multiplier (1.15 = +15%)
  flat?: number;       // Flat bonus (0.5 = +0.5)
}

interface StatModifiers {
  damageMultiplier: number;   // Default 1.0
  hpMultiplier: number;       // Default 1.0
  costMultiplier: number;     // Default 1.0
  cooldownMultiplier: number; // Default 1.0
}

interface StageDefinition {
  id: number;
  world: 'grasslands' | 'forest' | 'mountains' | 'volcano';
  name: string;
  enemyHPMultiplier: number;
  enemyDamageMultiplier: number;
  waves: WaveDefinition[];
  baseGoldReward: number;
  targetTime: number;
  unlocksUnit?: string;
  requiresGold?: number;  // For Griffin, Paladin, Dragon
}

interface WaveDefinition {
  spawns: SpawnDefinition[];
  delayAfter: number;
}

interface SpawnDefinition {
  enemyId: string;
  count: number;
  spawnDelay: number;
  spawnInterval: number;
}

interface BattleRewards {
  baseGold: number;
  bonusGold: number;   // From kills
  timeBonus: number;   // Fast clear
  stars: number;       // 1-3
  totalGold: number;
  gems: number;        // First clear bonus
  unitUnlock?: string;
}
```

## Module Use Cases (UC-PROG)

### UC-PROG-1: Get stage definition

**Participates in:** IUC-2 (Stage selection to battle)
**Touches:** `stages.ts`
**Depends:** none

**Given:** Player selects stage from level select
**When:** `getStage(stageId)` called
**Then:** Returns stage definition with waves, multipliers, rewards

**Contract:**
- Input: `stageId: number` (1-20, or 0 for endless)
- Output: `StageDefinition`
- Errors: Throw if stageId invalid

**Acceptance:** `getStage(1)` returns stage with 3 waves

---

### UC-PROG-2: Award battle gold

**Participates in:** IUC-3 (Combat round)
**Touches:** `EconomyManager.ts`, `GameState.ts`
**Depends:** none

**Given:** Enemy killed during battle
**When:** `economyManager.addGold(amount)` called
**Then:** Gold added to battle state, total tracked

**Contract:**
- Input: `amount: number` (gold drop from enemy)
- Output: `battleState.gold += amount`, event emitted
- Errors: None (negative amount ignored)

**Acceptance:** Kill goblin, battleState.gold increases by 5

---

### UC-PROG-3: Calculate battle rewards

**Participates in:** IUC-4 (Battle victory)
**Touches:** `EconomyManager.ts`, `stages.ts`
**Depends:** UC-PROG-1

**Given:** Battle won
**When:** `calculateRewards(stageId, baseHP, time, killGold)` called
**Then:** Returns total gold, gems, stars, unlocks

**Contract:**
- Input: Stage ID, remaining base HP %, elapsed time, gold earned from kills
- Output: `BattleRewards` object
- Errors: None

**Acceptance:** Win stage 1 with 80% HP in 60s, get 3 stars + 60 base gold

---

### UC-PROG-4: Check spawn affordability

**Participates in:** IUC-5 (Unit spawning)
**Touches:** `EconomyManager.ts`, `UpgradeManager.ts`
**Depends:** UC-PROG-5

**Given:** Player attempts to spawn unit
**When:** `economyManager.canSpend(unitCost)` called
**Then:** Returns true if battleState.gold >= adjusted cost

**Contract:**
- Input: Unit ID (cost lookup + utility upgrade modifier)
- Output: `boolean`
- Errors: None

**Acceptance:** With 10 gold, cannot afford Knight (40g), can afford Swordsman (15g)

---

### UC-PROG-5: Apply unit upgrades

**Participates in:** IUC-6 (Upgrade purchase)
**Touches:** `UpgradeManager.ts`, `GameState.ts`
**Depends:** none

**Given:** Player has gold, upgrade not purchased
**When:** `upgradeManager.purchase('swordsman', 'offense', 1)` called
**Then:** Gold deducted, upgrade tier incremented in GameState

**Contract:**
- Input: `unitId: string`, `path: string`, `tier: number`
- Output: `boolean` success, state updated
- Errors: Return false if insufficient gold or already purchased

**Acceptance:** Buy T1 offense for 150g, unitUpgrades.swordsman.offense = 1

---

### UC-PROG-6: Save game to localStorage

**Participates in:** IUC-7 (Save/load)
**Touches:** `SaveManager.ts`
**Depends:** none

**Given:** GameState with player progress
**When:** `SaveManager.save(gameState)` called
**Then:** JSON written to localStorage with version

**Contract:**
- Input: `GameState`
- Output: localStorage entry `miniWarriorsSave`
- Errors: Log warning if storage full

**Acceptance:** `JSON.parse(localStorage.getItem('miniWarriorsSave')).state.gold` equals saved value

---

### UC-PROG-7: Load game from localStorage

**Participates in:** IUC-7 (Save/load)
**Touches:** `SaveManager.ts`
**Depends:** none

**Given:** localStorage contains saved game
**When:** `SaveManager.load()` called
**Then:** Returns GameState, handles version migration

**Contract:**
- Input: None (reads localStorage)
- Output: `GameState | null`
- Errors: Return null if no save or parse error

**Acceptance:** Save, refresh, load returns same highestStage

---

### UC-PROG-8: Migrate old save version

**Participates in:** standalone
**Touches:** `SaveManager.ts`
**Depends:** UC-PROG-7

**Given:** Save with version < CURRENT_VERSION
**When:** `SaveManager.load()` called
**Then:** Migration functions applied in sequence

**Contract:**
- Input: Old save data
- Output: Updated GameState with new fields
- Errors: Log migration steps, continue on partial failure

**Acceptance:** Load v0 save, verify new fields added with defaults

---

### UC-PROG-9: Get upgrade modifiers for unit

**Participates in:** IUC-6 (Upgrade purchase)
**Touches:** `UpgradeManager.ts`
**Depends:** UC-PROG-5

**Given:** Unit with purchased upgrades
**When:** `upgradeManager.getModifiers('swordsman')` called
**Then:** Returns combined stat multipliers

**Contract:**
- Input: `unitId: string`
- Output: `StatModifiers { damageMultiplier: 1.15, ... }`
- Errors: Return 1.0 multipliers if no upgrades

**Acceptance:** Swordsman with T1 offense returns damageMultiplier = 1.15

---

### UC-PROG-10: Apply castle upgrades

**Participates in:** standalone
**Touches:** `UpgradeManager.ts`, `GameState.ts`
**Depends:** none

**Given:** Player has gold for castle upgrade
**When:** `upgradeManager.purchaseCastle('fortification', 1)` called
**Then:** Gold deducted, castle upgrade incremented

**Contract:**
- Input: `upgradeId: string`, `level: number`
- Output: `boolean` success
- Errors: Return false if insufficient gold or max level

**Acceptance:** Buy Fortification L1, castleUpgrades.fortification = 1

---

### UC-PROG-11: Check unit unlock status

**Participates in:** IUC-2 (Stage selection)
**Touches:** `GameState.ts`, `stages.ts`
**Depends:** none

**Given:** Player has cleared certain stages
**When:** `isUnitUnlocked('archer')` called
**Then:** Returns true if stage 2 cleared

**Contract:**
- Input: `unitId: string`
- Output: `boolean`
- Errors: Return false for unknown unit

**Acceptance:** Clear stage 2, archer now unlocked

---

### UC-PROG-12: Unlock unit on stage clear

**Participates in:** IUC-4 (Battle victory)
**Touches:** `GameState.ts`, `stages.ts`
**Depends:** UC-PROG-1

**Given:** Stage has `unlocksUnit` defined
**When:** First-time stage victory
**Then:** Unit added to `unlockedUnits`

**Contract:**
- Input: Stage clear event with stageId
- Output: `gameState.unlockedUnits.push(unitId)`
- Errors: None (duplicate adds ignored)

**Acceptance:** Clear stage 2, 'archer' in unlockedUnits

---

### UC-PROG-13: Passive gold income

**Participates in:** standalone
**Touches:** `EconomyManager.ts`, `UpgradeManager.ts`
**Depends:** UC-PROG-10

**Given:** Battle in progress, Gold Mine upgraded
**When:** Update tick (1 second passed)
**Then:** Gold added based on Gold Mine level

**Contract:**
- Input: `castleUpgrades.goldMine` level
- Output: `battleState.gold += 0.5 * level` per second
- Errors: None

**Acceptance:** Gold Mine L2, gain 1 gold/sec during battle

---

### UC-PROG-14: Star rating calculation

**Participates in:** IUC-4 (Battle victory)
**Touches:** `stages.ts`
**Depends:** UC-PROG-1

**Given:** Battle complete
**When:** `calculateStars(baseHP, maxHP, elapsed, targetTime)` called
**Then:** Returns 1-3 stars based on criteria

**Contract:**
- Input: Base HP remaining, elapsed time, target time
- Output: `1 | 2 | 3`
- 1 star: Victory
- 2 stars: 50%+ base HP
- 3 stars: 75%+ base HP AND under target time

**Acceptance:** 80% HP, 50s (target 90s) = 3 stars

---

### UC-PROG-15: Elite unit gold requirement

**Participates in:** IUC-4 (Battle victory)
**Touches:** `GameState.ts`, `stages.ts`
**Depends:** UC-PROG-12

**Given:** Stage 15 cleared (Griffin unlock)
**When:** `canUnlockUnit('griffin')` checked
**Then:** Returns true only if stage cleared AND player has 500g

**Contract:**
- Input: `unitId: string`
- Output: `boolean`
- Errors: None

**Acceptance:** Clear stage 15 with <500g, Griffin not unlocked

---

## Internal Data Flow

```
BattleScene.create()
   │
   ├──► getStage(stageId)
   │         │
   │         ▼
   │    StageDefinition ──► WaveManager
   │
   ├──► UpgradeManager.getModifiers(unitId)
   │         │
   │         ▼
   │    StatModifiers ──► PlayerUnit stats
   │
   └──► EconomyManager.init(startingGold)

BattleScene.update()
   │
   ├──► EconomyManager.passiveIncome()
   │
   └──► on enemy kill:
             EconomyManager.addGold(drop)

BattleScene.endBattle()
   │
   ├──► calculateRewards()
   │         │
   │         ▼
   │    BattleRewards
   │
   ├──► EconomyManager.applyRewards()
   │
   └──► SaveManager.save()
```

## Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Version migration | Save format changes | `if (save.version < 2) migrate_v1_to_v2(save)` |
| Lookup table | Static definitions | `STAGES[stageId]` |
| Multiplier stacking | Combined upgrades | `base * offense * armory` |
| Event-driven economy | Decoupled gold updates | `events.emit('gold-changed', gold)` |

## Dependencies

| This Module Uses | Used By |
|------------------|---------|
| Core (GameState) | Units (stat modifiers), UI (shop) |

## Common Tasks

| Task | Solution |
|------|----------|
| Add new stage | Add to `stages.ts` with waves, multipliers |
| Change upgrade cost | Edit `upgrades.ts` tier costs |
| Add new currency | Add field to GameState, update SaveManager |
| Test save migration | Create old-format save, call `load()` |
| Adjust economy | Edit gold drops in `enemies.ts`, rewards in `stages.ts` |

## Gotchas

**Floating point gold:** Use integers for gold storage, display can show decimals.

**Save corruption:** Always validate loaded data against expected types.

**Version drift:** New features need migration path from old saves.

**Upgrade stacking:** Order of multiplication matters (apply per-unit before global).

**Unlock timing:** Check unlock conditions after rewards applied, not before.

---
<!-- PLACEMENT RULE: Only UC-PROG-N belong in this file.
     Cross-module flows go in CODEMAP_OVERVIEW.md as IUC-N -->
