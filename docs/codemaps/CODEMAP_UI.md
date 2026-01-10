# Codemap: UI Module

> HUD components, menu scenes UI, loadout selection, shop/upgrade interfaces.

## Placement Rule

A use case belongs in THIS file if:
- It involves ONLY UI module (display, input handling for UI)
- It can be tested by mocking GameState and scene
- It has clear contract: input -> UI -> output

If a UC spans multiple modules -> put it in CODEMAP_OVERVIEW.md as IUC-N.

## Key Files

| File | Responsibility |
|------|----------------|
| `src/ui/HUD.ts` | Battle UI container (gold, wave, HP bars) |
| `src/ui/SpawnBar.ts` | Unit spawn buttons with cooldowns |
| `src/ui/HealthBar.ts` | Unit/base health bar display |
| `src/ui/UpgradeTree.ts` | Upgrade path visualization |
| `src/ui/UnitCard.ts` | Unit selection/info card |
| `src/ui/LoadoutGrid.ts` | Pre-battle unit selection grid |
| `src/scenes/MenuScene.ts` | Main menu UI layout |
| `src/scenes/LevelSelectScene.ts` | Stage selection grid |
| `src/scenes/LoadoutScene.ts` | Pre-battle loadout UI |
| `src/scenes/UpgradeScene.ts` | Shop UI |
| `src/scenes/overlays/PauseOverlay.ts` | Pause menu UI |
| `src/scenes/overlays/ResultsOverlay.ts` | Victory/defeat screen |

## Public API

| Function/Class | Signature | Purpose |
|----------------|-----------|---------|
| `HUD` | `class` | Battle HUD container |
| `HUD.updateGold` | `(amount: number) => void` | Refresh gold display |
| `HUD.updateWave` | `(current, total) => void` | Refresh wave counter |
| `HUD.updateBaseHP` | `(hp, maxHp, isPlayer) => void` | Refresh base HP bar |
| `SpawnBar` | `class` | Spawn button row |
| `SpawnBar.updateCooldown` | `(unitId, progress) => void` | Update cooldown overlay |
| `SpawnBar.setAffordable` | `(unitId, canAfford) => void` | Enable/disable button |
| `HealthBar` | `class extends Container` | HP bar above units |
| `HealthBar.setPercent` | `(percent) => void` | Update fill width |
| `UpgradeTree` | `class` | Upgrade path UI component |
| `LoadoutGrid` | `class` | Unit selection grid |
| `UnitCard` | `class` | Unit info display |

## Key Types

```typescript
interface HUDConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
}

interface SpawnButtonConfig {
  unitId: string;
  icon: string;
  cost: number;
  cooldown: number;
  keyboardShortcut: string;  // '1', '2', etc.
}

interface HealthBarConfig {
  width: number;
  height: number;
  backgroundColor: number;
  fillColor: number;
  warningColor: number;   // Yellow at 50%
  dangerColor: number;    // Red at 25%
}

interface UpgradeNodeConfig {
  upgradeId: string;
  tier: number;
  cost: number;
  isPurchased: boolean;
  isAffordable: boolean;
  isLocked: boolean;  // Previous tier not purchased
}

interface LoadoutSlot {
  unitId: string | null;
  isLocked: boolean;  // Not unlocked yet
  isSelected: boolean;
}

interface ResultsScreenData {
  result: 'victory' | 'defeat';
  stars: number;
  rewards: {
    baseGold: number;
    bonusGold: number;
    totalGold: number;
    gems: number;
  };
  newUnlock?: string;
  stageId: number;
}

// Rex UI component types
interface RexButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  background: Phaser.GameObjects.GameObject;
  icon?: Phaser.GameObjects.Image;
  text?: Phaser.GameObjects.Text;
  space?: { left: number; right: number; top: number; bottom: number };
}

interface RexSliderConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  track: Phaser.GameObjects.GameObject;
  indicator: Phaser.GameObjects.GameObject;
  thumb: Phaser.GameObjects.GameObject;
}
```

## Module Use Cases (UC-UI)

### UC-UI-1: Display main menu

**Participates in:** IUC-1 (Game boot)
**Touches:** `MenuScene.ts`
**Depends:** none

**Given:** PreloadScene complete
**When:** MenuScene.create() runs
**Then:** Main menu displayed with Play, Options, Stats buttons

**Contract:**
- Input: GameState from registry (for stats display)
- Output: Interactive buttons
- Errors: None

**Acceptance:** Visual: menu has 3 working buttons

---

### UC-UI-2: Display level select grid

**Participates in:** IUC-2 (Stage selection)
**Touches:** `LevelSelectScene.ts`
**Depends:** UC-UI-1

**Given:** Player on LevelSelectScene
**When:** Scene creates
**Then:** Grid of stages with locked/unlocked/starred states

**Contract:**
- Input: `gameState.highestStage`, `gameState.stageStars`
- Output: Clickable stage buttons, scroll if needed
- Errors: None

**Acceptance:** Stages 1-highestStage+1 clickable, rest locked

---

### UC-UI-3: Display battle HUD

**Participates in:** IUC-3 (Combat round)
**Touches:** `HUD.ts`, `BattleScene.ts`
**Depends:** none

**Given:** BattleScene active
**When:** HUD initialized
**Then:** Gold counter, wave indicator, base HP bars visible

**Contract:**
- Input: Initial battle state values
- Output: HUD container with children
- Errors: None

**Acceptance:** HUD shows gold, wave 1/3, full HP bars

---

### UC-UI-4: Display results overlay

**Participates in:** IUC-4 (Battle victory)
**Touches:** `ResultsOverlay.ts`
**Depends:** UC-UI-3

**Given:** Battle ended
**When:** ResultsOverlay launched
**Then:** Victory/defeat banner, stars, rewards, continue button

**Contract:**
- Input: `ResultsScreenData`
- Output: Animated results screen
- Errors: None

**Acceptance:** Win shows stars filling, gold counting up

---

### UC-UI-5: Update spawn button cooldowns

**Participates in:** IUC-5 (Unit spawning)
**Touches:** `SpawnBar.ts`
**Depends:** UC-UI-3

**Given:** Unit spawned
**When:** Cooldown active
**Then:** Button shows circular progress overlay

**Contract:**
- Input: `unitId`, `progress` (0-1)
- Output: CircularProgress overlay updated
- Errors: None

**Acceptance:** Spawn swordsman, button darkens with circular fill

---

### UC-UI-6: Display upgrade tree

**Participates in:** IUC-6 (Upgrade purchase)
**Touches:** `UpgradeTree.ts`, `UpgradeScene.ts`
**Depends:** none

**Given:** Player on UpgradeScene
**When:** Unit selected
**Then:** 3-path upgrade tree with purchasable nodes highlighted

**Contract:**
- Input: Unit ID, `gameState.unitUpgrades[unitId]`
- Output: Interactive upgrade nodes
- Errors: None

**Acceptance:** Swordsman shows 3 paths, T1 nodes clickable

---

### UC-UI-7: Display pause overlay

**Participates in:** IUC-8 (Pause and resume)
**Touches:** `PauseOverlay.ts`
**Depends:** none

**Given:** Battle paused
**When:** PauseOverlay launched
**Then:** Semi-transparent overlay with Resume, Settings, Quit buttons

**Contract:**
- Input: None
- Output: Interactive pause menu
- Errors: None

**Acceptance:** Pause shows overlay, Resume returns to battle

---

### UC-UI-8: Display loadout selection

**Participates in:** IUC-2 (Stage selection)
**Touches:** `LoadoutScene.ts`, `LoadoutGrid.ts`
**Depends:** none

**Given:** Player on LoadoutScene
**When:** Scene creates
**Then:** Grid of unlocked units, 5 slots for battle loadout

**Contract:**
- Input: `gameState.unlockedUnits`
- Output: Selectable unit cards, Battle button
- Errors: None

**Acceptance:** Click unit to add to loadout, max 5

---

### UC-UI-9: Health bar follows unit

**Participates in:** IUC-3 (Combat round)
**Touches:** `HealthBar.ts`, `Unit.ts`
**Depends:** none

**Given:** Unit on battlefield
**When:** Unit moves or takes damage
**Then:** Health bar stays above unit, fill reflects HP

**Contract:**
- Input: Unit position, HP/maxHP
- Output: HealthBar positioned and sized
- Errors: None

**Acceptance:** Damaged unit shows reduced HP bar

---

### UC-UI-10: Damage number popup

**Participates in:** IUC-3 (Combat round)
**Touches:** `BattleScene.ts` or `DamageNumbers.ts`
**Depends:** none

**Given:** Unit takes damage
**When:** Damage applied
**Then:** Floating number appears, rises, fades

**Contract:**
- Input: Position, damage amount, isCritical
- Output: Tween animation on text object
- Errors: None

**Acceptance:** Hit enemy, see "-10" float upward

---

### UC-UI-11: Wave announcement

**Participates in:** IUC-3 (Combat round)
**Touches:** `HUD.ts`
**Depends:** UC-UI-3

**Given:** New wave starting
**When:** Wave timer triggers
**Then:** "Wave X" banner slides in, holds, slides out

**Contract:**
- Input: Wave number
- Output: Animated banner
- Errors: None

**Acceptance:** Wave 2 starts, "Wave 2" appears center screen

---

### UC-UI-12: Gold change feedback

**Participates in:** IUC-5 (Unit spawning)
**Touches:** `HUD.ts`
**Depends:** UC-UI-3

**Given:** Gold added or spent
**When:** Economy event fires
**Then:** Gold counter updates with +/- feedback

**Contract:**
- Input: New gold amount, delta
- Output: Counter tween, optional popup
- Errors: None

**Acceptance:** Spend 15g, counter briefly flashes, shows new value

---

### UC-UI-13: Stage info tooltip

**Participates in:** IUC-2 (Stage selection)
**Touches:** `LevelSelectScene.ts`
**Depends:** UC-UI-2

**Given:** Player hovers/long-presses stage button
**When:** Hover event fires
**Then:** Tooltip shows stage name, enemy types, rewards

**Contract:**
- Input: Stage ID
- Output: Tooltip popup
- Errors: None

**Acceptance:** Hover stage 5, see "Grasslands" and "Brute (mini-boss)"

---

### UC-UI-14: Unit stat tooltip

**Participates in:** IUC-2 (Stage selection), IUC-6 (Upgrade)
**Touches:** `UnitCard.ts`, `LoadoutGrid.ts`
**Depends:** none

**Given:** Player hovers/long-presses unit
**When:** Hover event fires
**Then:** Tooltip shows HP, DMG, range, ability

**Contract:**
- Input: Unit ID
- Output: Tooltip with stats
- Errors: None

**Acceptance:** Hover Archer, see "DMG: 14, Range: 200px"

---

### UC-UI-15: Disable spawn button when unaffordable

**Participates in:** IUC-5 (Unit spawning)
**Touches:** `SpawnBar.ts`
**Depends:** UC-UI-3

**Given:** Player gold < unit cost
**When:** Gold changes
**Then:** Button visually disabled, tap ignored

**Contract:**
- Input: `canAfford: boolean`
- Output: Button alpha/tint change
- Errors: None

**Acceptance:** 10 gold, Knight button (40g) grayed out

---

### UC-UI-16: Volume slider

**Participates in:** standalone
**Touches:** `PauseOverlay.ts` or `MenuScene.ts`
**Depends:** none

**Given:** Settings menu open
**When:** Player drags volume slider
**Then:** Volume updates in real-time, saved to settings

**Contract:**
- Input: Slider value (0-1)
- Output: `gameState.settings.musicVolume` updated
- Errors: None

**Acceptance:** Drag music slider, hear volume change

---

### UC-UI-17: Purchase confirmation dialog

**Participates in:** IUC-6 (Upgrade purchase)
**Touches:** `UpgradeScene.ts`
**Depends:** UC-UI-6

**Given:** Player clicks upgrade node
**When:** Click event fires
**Then:** Dialog shows cost, confirm/cancel buttons

**Contract:**
- Input: Upgrade details
- Output: Rex Dialog popup
- Errors: None

**Acceptance:** Click T1 upgrade, dialog asks "150g - Confirm?"

---

### UC-UI-18: Castle upgrade panel

**Participates in:** IUC-6 (Upgrade purchase)
**Touches:** `UpgradeScene.ts`
**Depends:** UC-UI-6

**Given:** Player on UpgradeScene, Castle tab selected
**When:** Tab pages switched
**Then:** Castle upgrades grid displayed

**Contract:**
- Input: `gameState.castleUpgrades`
- Output: 5 upgrade bars with level indicators
- Errors: None

**Acceptance:** See Fortification at L2/5, next cost displayed

---

## Internal Data Flow

```
BattleScene.create()
   │
   └──► HUD.create()
             │
             ├── GoldDisplay
             ├── WaveCounter
             ├── PlayerBaseHP
             ├── EnemyBaseHP
             └── SpawnBar
                    │
                    └── SpawnButton[] (per loadout unit)

BattleScene.update()
   │
   ├──► SpawnBar.updateCooldowns(dt)
   │
   ├──► HealthBar.update() (per unit)
   │
   └──► HUD.updateGold(battleState.gold)

Event: 'gold-changed'
   │
   └──► HUD.onGoldChanged(amount)

Event: 'unit-damaged'
   │
   └──► DamageNumbers.show(x, y, damage)
```

## Patterns

| Pattern | When to Use | Example |
|---------|-------------|---------|
| Container grouping | Related UI elements | `hud = new Container(); hud.add([gold, wave, hp])` |
| Rex UI components | Complex widgets | `new Buttons(scene, config)` |
| Nine-slice | Scalable panels | `scene.add.nineslice(x, y, 'panel', frame, w, h)` |
| Object pooling | Damage numbers | `damagePool.get().setText(damage)` |
| Tween chaining | Animations | `tweens.add({ ... }).on('complete', next)` |

## Rex UI Components Used

| Component | Usage |
|-----------|-------|
| `Buttons` | Unit spawn bar |
| `GridButtons` | Loadout selection |
| `Label` | Stat displays |
| `Slider` | Volume controls |
| `Dialog` | Confirmation popups |
| `Toast` | Battle notifications |
| `CircularProgress` | Cooldown indicators |
| `TabPages` | Upgrade shop categories |

## Dependencies

| This Module Uses | Used By |
|------------------|---------|
| Core (scenes, registry) | — |
| Progression (upgrade data) | — |
| Units (unit definitions) | — |
| Audio (button SFX) | — |

## Common Tasks

| Task | Solution |
|------|----------|
| Add HUD element | Create in `HUD.create()`, add to container |
| Style button | Use RexUI Buttons with background/icon/text |
| Animate feedback | Use `scene.tweens.add()` with easing |
| Add tooltip | Use RexUI Label, show on pointerover |
| Create dialog | Use RexUI Dialog with content/actions |

## Gotchas

**Touch target size:** Minimum 48px for mobile usability.

**Z-ordering:** UI must be above game objects; use `setDepth()` or separate layers.

**Input priority:** Overlays need `scene.input.setTopOnly(true)`.

**Rex UI import:** Import from `'phaser3-rex-plugins/templates/ui/ui-components'`.

**Font loading:** Load bitmap fonts in PreloadScene before use.

**Responsive layout:** Calculate positions from `game.config.width/height`, not hardcoded.

---
<!-- PLACEMENT RULE: Only UC-UI-N belong in this file.
     Cross-module flows go in CODEMAP_OVERVIEW.md as IUC-N -->
