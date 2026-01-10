# Codemap: Units Module

> Unit entities (player and enemy), AI state machines, and combat system.

## Placement Rule

A use case belongs in THIS file if:
- It involves ONLY Units module (entities, AI, combat)
- It can be tested by mocking GameState and scene
- It has clear contract: input -> Units -> output

If a UC spans multiple modules -> put it in CODEMAP_OVERVIEW.md as IUC-N.

## Key Files

| File | Responsibility |
|------|----------------|
| `src/entities/Unit.ts` | Base unit class with common logic |
| `src/entities/PlayerUnit.ts` | Player-controlled unit subclass |
| `src/entities/EnemyUnit.ts` | Enemy unit subclass |
| `src/entities/Projectile.ts` | Ranged attack projectiles |
| `src/entities/Base.ts` | Player/enemy base buildings |
| `src/systems/StateMachine.ts` | Generic FSM for unit AI |
| `src/systems/CombatSystem.ts` | Damage calculation, targeting |
| `src/systems/WaveManager.ts` | Enemy wave spawning |
| `src/data/units.ts` | Player unit definitions |
| `src/data/enemies.ts` | Enemy unit definitions |

## Public API

| Function/Class | Signature | Purpose |
|----------------|-----------|---------|
| `Unit` | `abstract class extends Phaser.GameObjects.Sprite` | Base unit |
| `PlayerUnit` | `class extends Unit` | Spawnable player unit |
| `EnemyUnit` | `class extends Unit` | Wave-spawned enemy |
| `Projectile` | `class extends Phaser.GameObjects.Sprite` | Ranged projectile |
| `Base` | `class extends Phaser.GameObjects.Sprite` | Base building |
| `StateMachine` | `class` | FSM controller |
| `CombatSystem` | `class` | Singleton combat manager |
| `WaveManager` | `class` | Wave spawn controller |
| `createPlayerUnit` | `(scene, unitId, x, y) => PlayerUnit` | Factory function |
| `createEnemyUnit` | `(scene, enemyId, x, y) => EnemyUnit` | Factory function |

## Key Types

```typescript
interface UnitDefinition {
  id: string;
  name: string;
  description: string;
  stats: UnitStats;
  combat: CombatProperties;
  movement: MovementProperties;
  behavior: BehaviorType;
  passiveAbility: AbilityDefinition | null;
  activeAbility: AbilityDefinition | null;
  spriteKey: string;
  scale: number;
  animations: AnimationSet;
}

interface UnitStats {
  hp: number;
  damage: number;
  attackSpeed: number;    // attacks per second
  moveSpeed: number;      // pixels per second
  range: number;          // pixels
  cost: number;           // gold
  cooldown: number;       // seconds
}

interface CombatProperties {
  attackType: 'melee' | 'ranged' | 'siege';
  damageType: 'physical' | 'magical' | 'true';
  targetPriority: 'nearest' | 'lowest_hp' | 'base';
  canTargetFlying: boolean;
}

interface MovementProperties {
  type: 'ground' | 'flying';
  canBeBlocked: boolean;
}

type BehaviorType =
  | 'melee_aggressor'
  | 'ranged_attacker'
  | 'support_caster'
  | 'flying_unit'
  | 'tank_unit';

interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  effect: AbilityEffect;
}

interface AbilityEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'summon';
  value: number;
  radius?: number;
  duration?: number;
  target: 'self' | 'allies' | 'enemies' | 'all';
}

interface AnimationSet {
  idle: { key: string; frames: number; frameRate: number };
  walk: { key: string; frames: number; frameRate: number };
  attack: { key: string; frames: number; frameRate: number };
  death: { key: string; frames: number; frameRate: number };
  // Optional
  heal?: { key: string; frames: number; frameRate: number };
  fly?: { key: string; frames: number; frameRate: number };
}

type UnitState = 'idle' | 'moving' | 'attacking' | 'retreating' | 'supporting' | 'holding' | 'dying';

interface StateTransition {
  from: UnitState;
  to: UnitState;
  condition: (unit: Unit) => boolean;
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
```

## Module Use Cases (UC-UNITS)

### UC-UNITS-1: Create player unit

**Participates in:** IUC-2 (Stage selection to battle)
**Touches:** `PlayerUnit.ts`, `units.ts`
**Depends:** none

**Given:** BattleScene active with unit definitions loaded
**When:** `createPlayerUnit(scene, 'swordsman', x, y)` called
**Then:** PlayerUnit sprite created with correct stats from definition

**Contract:**
- Input: `unitId: string`, position
- Output: PlayerUnit instance added to scene
- Errors: Throw if unitId not found in definitions

**Acceptance:** Spawn swordsman, verify HP=50, damage=10

---

### UC-UNITS-2: Unit AI state transitions

**Participates in:** IUC-3 (Combat round with wave completion)
**Touches:** `StateMachine.ts`, `Unit.ts`
**Depends:** UC-UNITS-1

**Given:** Unit with MeleeAggressor behavior
**When:** Enemy enters melee range
**Then:** State transitions from `moving` to `attacking`

**Contract:**
- Input: Unit update tick, nearby entities
- Output: State change, animation change
- Errors: Invalid transition logged, state unchanged

**Acceptance:** Observe swordsman stop walking and swing when enemy in range

---

### UC-UNITS-3: Combat damage calculation

**Participates in:** IUC-3 (Combat round with wave completion)
**Touches:** `CombatSystem.ts`, `Unit.ts`
**Depends:** UC-UNITS-1

**Given:** Attacker in `attacking` state, target in range
**When:** Attack animation completes
**Then:** Target takes damage, health bar updates

**Contract:**
- Input: `attacker: Unit`, `target: Unit`
- Output: `target.hp -= calculateDamage(attacker, target)`
- Errors: None (damage clamped to 0 minimum)

**Acceptance:** Swordsman attacks goblin, goblin HP decreases by ~10

---

### UC-UNITS-4: Unit death and cleanup

**Participates in:** IUC-4 (Battle victory with rewards)
**Touches:** `Unit.ts`, `CombatSystem.ts`
**Depends:** UC-UNITS-3

**Given:** Unit with HP <= 0
**When:** Damage applied
**Then:** Unit transitions to `dying` state, death animation plays, unit destroyed

**Contract:**
- Input: Damage that reduces HP to 0 or below
- Output: Death animation, `destroy()` called, removed from physics group
- Errors: None

**Acceptance:** Kill enemy, verify death animation plays, sprite removed

---

### UC-UNITS-5: Spawn unit from factory

**Participates in:** IUC-5 (Unit spawning with cooldown)
**Touches:** `PlayerUnit.ts`, `BattleScene.ts`
**Depends:** UC-UNITS-1

**Given:** Player triggers spawn input
**When:** `createPlayerUnit` called with valid ID
**Then:** Unit created at spawn point, added to player units group

**Contract:**
- Input: `unitId`, spawn position (near player base)
- Output: PlayerUnit in `scene.playerUnits` group
- Errors: Return null if unit not unlocked

**Acceptance:** Spawn archer, verify appears at left side of battlefield

---

### UC-UNITS-6: Pause freezes all units

**Participates in:** IUC-8 (Pause and resume battle)
**Touches:** `Unit.ts`, `StateMachine.ts`
**Depends:** UC-UNITS-2

**Given:** Multiple units in various states
**When:** Game paused
**Then:** All unit state machines stop updating, animations pause

**Contract:**
- Input: Pause event
- Output: `unit.active = false` for all units
- Errors: None

**Acceptance:** Pause mid-attack, verify attack animation frozen

---

### UC-UNITS-7: Wave spawning

**Participates in:** IUC-3 (Combat round with wave completion)
**Touches:** `WaveManager.ts`, `EnemyUnit.ts`
**Depends:** UC-UNITS-1

**Given:** Wave definition with spawn groups
**When:** Wave timer triggers
**Then:** Enemies spawn according to definition (count, interval)

**Contract:**
- Input: `WaveDefinition` with spawns array
- Output: EnemyUnits created at enemy spawn point
- Errors: Log warning if enemyId not found

**Acceptance:** Wave 1 spawns 3 goblins with 2s spacing

---

### UC-UNITS-8: Projectile creation and hit

**Participates in:** IUC-3 (Combat round)
**Touches:** `Projectile.ts`, `CombatSystem.ts`
**Depends:** UC-UNITS-3

**Given:** Ranged unit (Archer) attacks
**When:** Attack animation reaches fire frame
**Then:** Projectile spawned, travels to target, deals damage on hit

**Contract:**
- Input: `attacker: Unit`, `target: Unit`
- Output: Projectile sprite, collision handler, damage on impact
- Errors: Projectile destroys on miss or offscreen

**Acceptance:** Archer fires arrow, arrow travels, enemy takes damage

---

### UC-UNITS-9: Apply upgrades to unit stats

**Participates in:** IUC-6 (Upgrade purchase flow)
**Touches:** `PlayerUnit.ts`, `units.ts`
**Depends:** UC-UNITS-1

**Given:** Unit with upgrades in GameState (e.g., offense T1)
**When:** Unit created
**Then:** Stats modified by upgrade multipliers

**Contract:**
- Input: Base stats + `UnitUpgrades { offense: 1, defense: 0, utility: 0 }`
- Output: Stats with +15% damage
- Errors: None (missing upgrades default to 0)

**Acceptance:** Upgrade swordsman offense T1, spawn, verify damage > 10

---

### UC-UNITS-10: Tank blocking behavior

**Participates in:** standalone
**Touches:** `StateMachine.ts`, `Unit.ts`
**Depends:** UC-UNITS-2

**Given:** Knight (tank_unit behavior) engaging enemies
**When:** Enemy reaches Knight's melee range
**Then:** Knight enters `holding` state, blocks enemy advance

**Contract:**
- Input: Enemy collision with Knight
- Output: Enemy stops at Knight position
- Errors: None

**Acceptance:** Knight stops goblin horde, enemies pile up behind

---

### UC-UNITS-11: Flying unit movement

**Participates in:** standalone
**Touches:** `Unit.ts`, `StateMachine.ts`
**Depends:** UC-UNITS-2

**Given:** Griffin or Dragon (flying_unit behavior)
**When:** Moving toward target
**Then:** Ignores ground collision, moves with sine wave pattern

**Contract:**
- Input: Target position
- Output: Movement with y offset = sin(time) * 5
- Errors: None

**Acceptance:** Observe Griffin bobbing while flying

---

### UC-UNITS-12: Healer support behavior

**Participates in:** standalone
**Touches:** `StateMachine.ts`, `CombatSystem.ts`
**Depends:** UC-UNITS-2

**Given:** Healer (support_caster behavior) with damaged ally nearby
**When:** Update tick
**Then:** Healer targets lowest HP ally, heals instead of attacking

**Contract:**
- Input: Ally with HP < maxHP in range
- Output: Heal effect, ally HP increases
- Errors: None (does nothing if no ally needs healing)

**Acceptance:** Damaged swordsman near healer regains HP

---

### UC-UNITS-13: Base takes damage

**Participates in:** IUC-4 (Battle victory)
**Touches:** `Base.ts`, `CombatSystem.ts`
**Depends:** UC-UNITS-3

**Given:** Enemy reaches player base (or player units reach enemy base)
**When:** Attack lands on base
**Then:** Base HP decreases, damage state visual updates

**Contract:**
- Input: Damage from attacking unit
- Output: `base.hp -= damage`, visual update at 66%, 33% HP
- Errors: None

**Acceptance:** Let enemy through, verify base HP decreases

---

### UC-UNITS-14: Enemy gold drop

**Participates in:** IUC-3 (Combat round)
**Touches:** `EnemyUnit.ts`, `CombatSystem.ts`
**Depends:** UC-UNITS-4

**Given:** Enemy unit dies
**When:** Death event fires
**Then:** Gold awarded to player based on enemy definition

**Contract:**
- Input: `enemyDefinition.goldDrop`
- Output: Event `'gold-earned'` with amount
- Errors: None

**Acceptance:** Kill goblin, verify +5 gold

---

### UC-UNITS-15: AOE damage (Mage splash)

**Participates in:** standalone
**Touches:** `CombatSystem.ts`, `Unit.ts`
**Depends:** UC-UNITS-3

**Given:** Mage attacks enemy
**When:** Primary damage dealt
**Then:** All enemies within 40px radius take 50% damage

**Contract:**
- Input: Primary target, splash radius, splash percent
- Output: Damage to all enemies in radius
- Errors: None (empty radius = no splash)

**Acceptance:** Mage attacks goblin cluster, multiple take damage

---

## Internal Data Flow

```
BattleScene.update()
   │
   ├──► WaveManager.update()
   │         │ spawn timer check
   │         ▼
   │    createEnemyUnit() ──► EnemyUnit
   │
   ├──► Unit.update() (all units)
   │         │
   │         ▼
   │    StateMachine.update()
   │         │ state transitions
   │         ▼
   │    [idle|moving|attacking|...]
   │         │
   │         ▼
   │    CombatSystem.processAttack()
   │         │
   │         ├──► Projectile.create() (if ranged)
   │         ▼
   │    target.takeDamage()
   │         │
   │         └──► if hp <= 0: Unit.die()
   │
   └──► Base.update() (check defeat condition)
```

## Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Object pooling | Projectiles, particles | `scene.projectilePool.get()` |
| State machine | Unit AI | `new StateMachine(unit, transitions)` |
| Factory function | Unit creation | `createPlayerUnit(scene, id, x, y)` |
| Component composition | Abilities | `unit.passiveAbility.apply(unit)` |

## Dependencies

| This Module Uses | Used By |
|------------------|---------|
| Core (GameState) | UI (HUD updates) |
| Progression (upgrades) | — |
| Audio (SFX triggers) | — |

## Common Tasks

| Task | Solution |
|------|----------|
| Add new player unit | Add definition to `units.ts`, add AI behavior if new type |
| Add new enemy | Add definition to `enemies.ts`, add to stage wave definitions |
| Add new ability | Define in unit's `passiveAbility`/`activeAbility`, implement in `CombatSystem` |
| Adjust AI behavior | Edit transitions in `StateMachine.ts` for behavior type |
| Balance unit | Edit stats in `units.ts` or `enemies.ts` |

## Gotchas

**Physics group management:** Units must be added to correct group (playerUnits/enemyUnits) for collision.

**Animation frame timing:** Attack damage should fire on specific frame, not animation complete.

**Projectile cleanup:** Projectiles must destroy on hit, miss, or leaving bounds to prevent memory leak.

**State machine ordering:** Transition conditions checked in order; first match wins.

**Flying targeting:** Ground melee units cannot target flying units (check `canTargetFlying`).

---
<!-- PLACEMENT RULE: Only UC-UNITS-N belong in this file.
     Cross-module flows go in CODEMAP_OVERVIEW.md as IUC-N -->
