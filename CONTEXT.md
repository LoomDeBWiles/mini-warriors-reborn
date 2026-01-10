# Context

## Commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

## Architecture

Mini Warriors Reborn is a 2D lane-defense strategy game built with Phaser 3 and TypeScript.

**Module structure:**
- `src/scenes/` - Phaser scenes (boot, preload, menu, battle, etc.)
- `src/entities/` - Game entities (units, projectiles, bases)
- `src/systems/` - Game systems (combat, spawning, AI)
- `src/managers/` - Singleton managers (GameState, AudioManager)
- `src/ui/` - UI components (HUD, buttons, overlays)
- `src/data/` - Static data (unit definitions, stage configs)

**Implementation order:** Core -> Audio -> Progression -> Units -> UI

See `docs/codemaps/CODEMAP_OVERVIEW.md` for full architecture and module dependencies.

## Gotchas

`config.ts`: Scene keys must match strings used in `scene.start()` calls.

## Patterns

**Registry for globals:** `this.registry.get('gameState') as GameState` for cross-scene data.

**Scene data passing:** `scene.start('battle', { stageId })` for transition-specific data.

**Overlay scenes:** `scene.launch('pauseOverlay')` for modal UI that doesn't replace parent scene.
