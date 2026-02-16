# Context

<!-- Scope: Operational knowledge for mini-warriors-reborn. See CODEMAP.md for architecture, key files, and data flow. -->

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Dev server (LAN) | `npm run dev -- --host 0.0.0.0` |
| Build | `npm run build` |
| Preview build | `npm run preview` |
| Public tunnel | `npx cloudflared tunnel --url http://localhost:5173` (in separate tab) |

`vite.config.ts` has `allowedHosts: true` to allow tunnel domains.

## Gotchas

- `config.ts`: Scene keys must match strings used in `scene.start()` calls
- `BattleScene.ts` is 898 lines and manages almost everything during combat — read it before touching battle behavior
- `ENEMY_SPRITE_MAP` in `animations.ts` maps enemy IDs to sprite filenames (many are mismatched — see `plans/art-overhaul.md`)
- `StateMachine.Supporting` state exists in enum but is never used in transitions
- `GameState.gems` and `GameState.unlockedAbilities` are tracked but have no economy/UI — dead features for now

## Patterns

**Registry singletons:** `this.registry.get('gameState') as GameState` for cross-scene state.

**Scene data passing:** `scene.start('battle', { stageId })` for transition-specific data.

**Overlay scenes:** `scene.launch('pauseOverlay')` for modal UI that doesn't replace parent scene.

**Unit factories:** `createPlayerUnit()` / `createEnemyUnit()` apply upgrades and stage multipliers to base stats defined in data files. Never construct `PlayerUnit`/`EnemyUnit` directly.

**Role color helper:** `getRoleColor(unit)` exists as a module-level function in both `LoadoutGrid.ts` and `SpawnBar.ts`. Logic: `range > 0` → ranged, `isTank` → tank, `isHealer` → support, else melee. Colors from `THEME.colors.role`. If a third file needs this, extract to `theme.ts`.

## Asset Generation

Game assets are AI-generated via MCP servers configured in `.mcp.json` (gitignored).

### API Keys (in .env)

| Service | Env Var | Purpose |
|---------|---------|---------|
| PixelLab | `PIXELLAB_API_KEY` | Sprite generation via MCP |
| AI/ML API | `AIMLAPI_KEY` | Music generation (MiniMax, Lyria 2) |

### Sprite Pipeline

PixelLab MCP generates characters with template animations, then a converter creates horizontal spritesheets.

**Reference workflow** (working example in `assets/demon_lord/`):
1. Generate with PixelLab MCP (proper prompts + template animations)
2. Raw output stored in `assets/{character_name}/`
3. Convert to horizontal spritesheet in `public/assets/sprites/`

See `plans/art-overhaul.md` for the full conversion plan and character inventory.

### Music Generation

Use AI/ML API (`https://api.aimlapi.com/v2/generate/audio`) with MiniMax Music or Lyria 2.

Free tier: 10 requests/hour. Output to `public/assets/audio/music/`.

Required tracks: menu, battle_easy, battle_hard, boss, upgrade, victory, defeat.

## Recent Changes

**UI Polish (w1_ui-polish)** — completed, all 7 beads closed:
- LoadoutGrid: role-colored stripes, HP/damage stat previews, ghost empty slots
- HUD: framed gold/wave panels, themed HP labels, low-HP pulse, wave banner with scale animation
- SpawnBar: role-colored bottom borders, unit sprite previews
- All UI components now import `THEME` from `./theme` — use `THEME.colors.role` for role colors, `getRoleColor(unit)` helper in LoadoutGrid/SpawnBar

## Plans

| Plan | Purpose | Status |
|------|---------|--------|
| `plans/art-overhaul.md` | Replace all sprites with proper PixelLab characters, add new units, projectile system | **Next up** — not yet started |
| `plans/ui-ux-improvements.md` | UI/UX polish: typography, buttons, transitions, battle HUD, victory screen | Partially done (w1_ui-polish covered HUD/loadout/spawnbar items) |

## Non-Source Directories

| Directory | Purpose | Tracked |
|-----------|---------|---------|
| `assets/` | Raw PixelLab output (ZIPs, frames) for sprite pipeline | Partially |
| `scripts/` | Old spritesheet generators (being replaced by art-overhaul converter) | Yes |
| `resources/text/pixellab/` | PixelLab API docs for mine knowledge engine | No |
| `prompts/` | System prompts for AI tools | Yes |
| `logs/`, `downloads/`, `.playwright-mcp/` | Agent/tool artifacts | Gitignored |
