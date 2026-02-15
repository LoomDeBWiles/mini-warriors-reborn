# Art Overhaul Plan

## Problem Statement

The game's character art is low quality despite having properly generated PixelLab characters available. Issues include:
- Game uses badly generated sprites from old scripts (free-form text animation prompts)
- PixelLab characters exist with proper template animations but aren't being used
- Format mismatch between PixelLab output (individual PNGs) and game expectation (horizontal spritesheets)
- "Dragon" looks like a red humanoid, not an actual dragon (BOTH player and enemy dragons)
- Lack of female character representation
- All projectiles are identical yellow circles

## Recent Changes (from remote)

### New Systems Added
- **DragonSpawner** (`src/systems/DragonSpawner.ts`) - Spawns `flying_dragon` enemies
- **Turret system** (`src/entities/Turret.ts`, `EnemyTurret.ts`) - Defensive structures
- **isFlying flag** - Added to EnemyDefinition, flying enemies can only be hit by turrets/flying units

### New Enemy: flying_dragon
```typescript
flying_dragon: {
  id: 'flying_dragon',
  name: 'Dragon',
  hp: 150,
  damage: 30,
  range: 0,
  speed: 70,
  goldDrop: 50,
  isFlying: true,
}
```
**Issue:** Uses same bad red humanoid sprite as player dragon - needs real dragon art.

### Demon Lord Assets Ready ✅
Proper PixelLab assets exist at `assets/demon_lord/`:
- **Prompt:** "menacing demon lord boss, dark red skin, large curved horns, glowing yellow eyes, black spiked armor, flowing dark cape, muscular intimidating build, evil overlord"
- **Animations:** breathing-idle, walking, cross-punch, falling-back-death
- **Status:** Already converted to `public/assets/sprites/enemies/demon_lord.png` - USE AS MODEL
- **Quality:** Good! Red demon with horns, proper animation sequence

This is the workflow we should follow for all characters:
1. Generate with PixelLab MCP (proper prompts + template animations)
2. Store raw assets in `assets/{character_name}/`
3. Convert to horizontal spritesheet in `public/assets/sprites/`

## Current State

### PixelLab Characters Available (23 total)

**Player Units:**
| ID | Name | Directions | Size | Animations |
|----|------|------------|------|------------|
| 935c72aa-... | Knight | 4 | 64x64 | 15 |
| 984ea4e3-... | Archer | 4 | 64x64 | 14 |
| 529281ad-... | Mage | 4 | 64x64 | 13 |
| 8779d79b-... | Healer | 4 | 64x64 | 16 |
| 2866ea4b-... | Assassin | 4 | 64x64 | 12 |
| 60dbc715-... | Catapult | 4 | 64x64 | 15 |
| d087e498-... | Griffin | 4 | 64x64 | 14 |
| e1edcdb0-... | Dragon | 4 | 64x64 | 14 |

**Enemies:**
| ID | Name | Directions | Size | Animations |
|----|------|------------|------|------------|
| dca58cd1-... | Demon Lord | 4 | 64x64 | 7 |
| 3691b3d7-... | Giant | 4 | 64x64 | 12 |
| b17f614a-... | Wizard Enemy | 4 | 64x64 | 14 |
| 79f96b0e-... | Archer Enemy | 4 | 64x64 | 16 |
| 0ad0f00e-... | Rider | 4 | 64x64 | 15 |
| 4ebcce6e-... | Speedy | 4 | 64x64 | 16 |
| 4708ede8-... | Brute | 4 | 64x64 | 16 |
| 0e8b1669-... | Slinger | 4 | 64x64 | 14 |
| 1314f16b-... | Warrior | 4 | 64x64 | 16 |
| 10d925a9-... | Dragon Rider | 4 | 64x64 | 16 |
| a4bdc41d-... | Harpy | 8 | 48x48 | 18 |

### Format Comparison

**PixelLab Output:**
```
character.zip/
├── metadata.json          # Contains original prompt
├── rotations/
│   ├── east.png
│   ├── west.png
│   ├── north.png
│   └── south.png
└── animations/
    ├── breathing-idle/
    │   ├── east/
    │   │   ├── frame_000.png
    │   │   ├── frame_001.png
    │   │   └── ...
    │   └── west/...
    ├── walking-6-frames/...
    └── high-kick/...
```

**Game Expected Format:**
```
character.png  # Single horizontal spritesheet
               # 64px × (frames * 64px)
               # Layout: [idle 4f][walk 8f][attack 4f][death 4f] = 20 frames
```

---

## Phase 1: Audit Existing Characters

### Tasks
- [ ] Download all 23 PixelLab character ZIPs
- [ ] Extract and review each character's appearance
- [ ] Document which characters need regeneration
- [ ] Create `characters.json` manifest with prompts and status

### Player Characters Needing Regeneration
| Character | Issue | New Prompt |
|-----------|-------|------------|
| Dragon | Looks like red humanoid, no wings | Large dragon with expansive wings, scales, fire breath, flying pose |

---

## Phase 1b: Audit Enemy Characters

### Current Enemy Sprite Mapping (from animations.ts)
The game has mismatched enemy names to sprite files:

| Enemy ID | Display Name | Sprite File | Match? | Issue |
|----------|--------------|-------------|--------|-------|
| goblin | Goblin | goblin | ✅ | - |
| wolf | Wolf | speedy | ❌ | Generic fast enemy, not a wolf |
| bandit | Bandit | warrior | ⚠️ | Generic warrior, could work |
| orc | Orc | brute | ⚠️ | Generic brute, could work |
| slime | Slime | slinger | ❌ | Slinger is ranged humanoid, not a slime |
| troll | Troll | wizard | ❌ | Wizard sprite for a troll?! |
| harpy | Harpy | harpy | ✅ | - |
| golem | Golem | rider | ❌ | Rider is mounted unit, not a golem |
| giant | Giant | giant | ✅ | - |
| dragon_boss | Dragon Boss | dinosaur | ❌ | Dinosaur, not a dragon |
| demon_lord | Demon Lord | dragon_rider | ⚠️ | Has proper assets in `assets/demon_lord/` - needs integration |
| flying_dragon | Dragon | flying_dragon | ❌ | Same red humanoid as player dragon - needs real dragon |

### Enemies Needing New Sprites

| Enemy | Type | Range | Prompt | Status |
|-------|------|-------|--------|--------|
| wolf | Melee | 0 | Fierce gray wolf, fangs bared, fur bristling, four-legged beast, fantasy style | Need new |
| slime | Melee | 0 | Green translucent slime blob, gooey dripping texture, simple cute monster | Need new |
| troll | Melee | 0 | Large green troll, tusks, muscular, club weapon, hunched posture, fantasy monster | Need new |
| golem | Melee | 0 | Stone golem, rocky body, glowing eyes, cracks with inner light, lumbering giant | Need new |
| flying_dragon | Flying | 0 | Fearsome dragon, large bat-like wings, scales, claws, flying pose, menacing | Need new |
| enemy_witch | Flying/Ranged | 140 | Evil witch on broomstick, tattered black robes, green skin, warts, cackling, dark magic | Need new |
| enemy_archer | Ranged | 180 | Skeleton archer, bone bow, hooded dark cloak, glowing red eyes, undead | Need new |
| dragon_boss | Ranged | 150 | Massive dragon, huge wings, breathing blue-hot fire, boss enemy, intimidating, powerful | Need new |
| demon_lord | Ranged | 120 | (Already generated) dark red skin, curved horns, glowing yellow eyes, black spiked armor | ✅ **DONE** - spritesheet ready |

### New Enemy Definitions Required
Add to `src/data/enemies.ts`:

```typescript
enemy_archer: {
  id: 'enemy_archer',
  name: 'Skeleton Archer',
  hp: 45,
  damage: 15,
  range: 180,
  speed: 40,
  goldDrop: 15,
},
enemy_witch: {
  id: 'enemy_witch',
  name: 'Dark Witch',
  hp: 70,
  damage: 18,
  range: 140,
  speed: 65,
  goldDrop: 20,
  isFlying: true,
},
```

### Ranged Units Comparison

**Player Ranged Units:**
| Unit | Range | Unlock | Flying | Projectile | Special |
|------|-------|--------|--------|------------|---------|
| archer | 200 | Stage 2 | No | Arrow | - |
| mage | 180 | Stage 6 | No | Orange fireball | Splash damage |
| healer | 150 | Stage 8 | No | Heal pulse | Heals allies |
| catapult | 300 | Stage 12 | No | Boulder | Siege |
| valkyrie | 160 | Stage 14 | Yes | Lightning bolt | NEW |
| dragon | 150 | Stage 20 | Yes | Dragon fire | Endgame |

**Enemy Ranged Units:**
| Unit | Range | First Appears | Flying | Projectile |
|------|-------|---------------|--------|------------|
| enemy_archer | 180 | Stage 5 | No | Dark arrow |
| enemy_witch | 140 | Stage 11 | Yes | Green orb |
| dragon_boss | 150 | Stage 16+ | No | Blue fire |
| demon_lord | 120 | Stage 20 | No | Purple laser |

### Enemy Spawn Stages
When new ranged enemies start appearing in waves:

| Enemy | First Stage | Notes |
|-------|-------------|-------|
| enemy_archer | 5 | Early ranged threat, easy to deal with |
| enemy_witch | 11 | Mid-game flying ranged, harder to counter |
| flying_dragon | 13 | Flying melee swarm (via DragonSpawner) |
| dragon_boss | 16 | Boss stages only |
| demon_lord | 20 | Final boss |

### Enemy Projectiles

**Ranged Enemies:**
| Enemy | Projectile | Size | Colors (hex) | Visual Description |
|-------|------------|------|--------------|---------------------|
| enemy_witch | Green orb | 14x14 | #00FF00 (core), #32CD32 (glow) | Bright green magical sphere with dark green wisps |
| enemy_archer | Dark arrow | 16x8 | #2F1810 (shaft), #4A4A4A (tip) | Black wooden arrow with iron arrowhead |
| dragon_boss | Blue fire | 28x20 | #00BFFF (core), #FFFFFF (hot center), #0080FF (flames) | Intense blue-white hot fire breath, searing heat |
| demon_lord | Purple laser | 24x8 | #8B00FF (beam), #FF00FF (core), #4B0082 (edge) | Dark purple energy beam with magenta crackling center |

**Melee Enemies (no projectile):**
| Enemy | Attack Style |
|-------|--------------|
| goblin | Dagger stab |
| wolf | Bite/claw |
| bandit | Sword slash |
| orc | Axe swing |
| slime | Body slam |
| troll | Club smash |
| harpy | Claw swipe |
| golem | Fist pound |
| giant | Stomp/punch |
| flying_dragon | Claw attack |

### Enemy Stat Changes Required
Update `src/data/enemies.ts`:

```typescript
// demon_lord needs range added
demon_lord: {
  ...
  range: 120,  // NEW: was 0
  ...
}
```

### Dragon Toughness Buffs

All dragon units should feel powerful and formidable.

**Player Dragon** (in `src/data/units.ts`):
| Stat | Current | New | Change |
|------|---------|-----|--------|
| hp | 300 | 400 | +33% |
| damage | 50 | 65 | +30% |
| speed | 90 | 85 | Slightly slower but more imposing |

**Dragon Boss** (in `src/data/enemies.ts`):
| Stat | Current | New | Change |
|------|---------|-----|--------|
| hp | 800 | 1200 | +50% |
| damage | 60 | 80 | +33% |
| range | 100 | 150 | Longer breath range |
| goldDrop | 150 | 200 | Better reward |

---

## Phase 2: Regenerate Problem Characters

### Dragon
```
Prompt: "Large fearsome dragon, expansive bat-like wings spread wide,
scaled body, long tail, breathing fire, fantasy medieval style"

Settings:
- size: 64
- n_directions: 4
- view: side
- detail: medium detail
- shading: basic shading

Animations needed:
- breathing-idle (flying hover)
- walking-4-frames (flying movement)
- fireball (fire breath attack)
- falling-back-death
```

---

## Phase 3: Generate New Female Characters

### Amazon
```
Prompt: "Fierce amazon warrior woman, athletic build, tribal war paint,
leather armor with fur trim, wielding battle axe, braided hair,
determined expression, fantasy medieval style"

Role: Melee fighter
Settings:
- size: 64
- n_directions: 4
- view: side
- detail: medium detail

Animations:
- breathing-idle
- walking-6-frames
- cross-punch or lead-jab (melee attack)
- falling-back-death

Stats suggestion:
- unlockStage: 5
- hp: 90
- damage: 20
- range: 0 (melee)
- speed: 95
```

### Valkyrie
```
Prompt: "Noble valkyrie warrior, feathered wings, ornate Norse armor,
winged helmet, wielding glowing spear crackling with lightning,
flowing cape, fantasy medieval style"

Role: Flying ranged (lightning)
Settings:
- size: 64
- n_directions: 4
- view: side
- isFlying: true

Animations:
- breathing-idle (hovering with wings)
- walking-6-frames (flying)
- throw-object (hurling lightning spear)
- falling-back-death

Stats suggestion:
- unlockStage: 14
- hp: 100
- damage: 30
- range: 160
- speed: 85
- isFlying: true
```

---

## Phase 4: Create Converter Script

### Purpose
Convert PixelLab ZIP output to game's horizontal spritesheet format.

### Animation Mapping
| PixelLab Animation | Game State | Target Frames |
|--------------------|------------|---------------|
| breathing-idle | idle | 4 |
| walking-4-frames / walking-6-frames | walk | 8 (pad/interpolate) |
| high-kick / cross-punch / fireball | attack | 4 |
| falling-back-death | death | 4 |

### Script Requirements
```
Input: character.zip or character_id
Output: public/assets/sprites/units/{name}.png

Steps:
1. Download ZIP from PixelLab API
2. Parse metadata.json for animation info
3. For each required animation (idle, walk, attack, death):
   - Find matching PixelLab animation
   - Extract frames for 'east' direction (player) or 'west' (enemy)
   - Pad/trim to target frame count
4. Concatenate horizontally into single spritesheet
5. Save as PNG
```

### Script Location
`scripts/convert-pixellab-sprite.ts`

---

## Phase 5: Projectile System

### Current State
All projectiles are yellow circles (4px radius Arc).

### New Projectile Types

| Unit | Projectile | Size | Colors (hex) | Visual Description |
|------|------------|------|--------------|---------------------|
| archer | Arrow | 16x8 | #8B4513 (shaft), #C0C0C0 (tip) | Wooden arrow with silver arrowhead, slight motion blur |
| mage | Fireball | 16x16 | #FF4500 (core), #FFD700 (glow) | Orange-red fire ball with yellow flame trail |
| dragon | Dragon fire | 24x16 | #FF6600 (core), #FFCC00 (glow) | Large orange fireball with swirling flames |
| witch | Green orb | 14x14 | #00FF00 (core), #32CD32 (glow) | Bright green magical sphere with dark green wisps |
| valkyrie | Lightning bolt | 20x8 | #00BFFF (bolt), #FFFFFF (core) | Electric blue jagged bolt with white-hot center |
| healer | Heal pulse | 12x12 | #FF69B4 (core), #FFB6C1 (glow) | Pink sparkling orb with soft glow |
| catapult | Boulder | 20x20 | #696969 (rock), #808080 (highlight) | Gray rough-hewn rock with darker cracks |

### Implementation
1. Create projectile sprites (16x16 or 24x24)
2. Add `projectileType` to unit definitions
3. Update `Projectile.ts` to use sprites instead of Arc
4. Add rotation based on direction of travel

### File Changes
- `src/data/units.ts` - Add projectileType field
- `src/systems/Projectile.ts` - Use sprite, add rotation
- `public/assets/sprites/projectiles/` - New sprites

---

## Phase 6: Integration

### Tasks
- [ ] Run converter script for all characters
- [ ] Replace sprites in `public/assets/sprites/units/`
- [ ] Replace sprites in `public/assets/sprites/enemies/`
- [ ] Update `src/data/animations.ts` with new frame counts
- [ ] Add new units to `src/data/units.ts`
- [ ] Test all animations in-game
- [ ] Verify projectile visuals

### Animation Config Updates
May need to adjust frame counts based on PixelLab output:
- breathing-idle: typically 4-6 frames
- walking: typically 4-8 frames
- attack: typically 4-7 frames
- death: typically 5-7 frames

---

## Success Criteria

- [ ] All characters use properly animated PixelLab sprites
- [ ] Dragon looks like an actual dragon with wings
- [ ] 3 new female characters playable (Amazon, Witch, Valkyrie)
- [ ] Each ranged unit has distinct projectile visual
- [ ] Animations are smooth and consistent across all units
- [ ] Character prompts documented for future regeneration

---

## Open Questions

1. Should we upgrade to 8-direction sprites for smoother movement?
2. Do enemies need unique projectiles too?
3. Should flying units have distinct flying animations vs walking?
4. What attack animations work best for melee vs ranged?
