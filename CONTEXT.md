# Context

## Commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Dev server (LAN access) | `npm run dev -- --host 0.0.0.0` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

### External Access (Public URL)

To share the dev server with external users (not on your local network):

**Tab 1 - Start dev server:**
```bash
npm run dev
```

**Tab 2 - Create public tunnel:**
```bash
npx cloudflared tunnel --url http://localhost:5173
```

The tunnel will output a public URL like `https://xyz.trycloudflare.com`. Share this URL with external testers.

**Note:** `vite.config.ts` has `allowedHosts: true` to allow tunnel domains.

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

## Asset Generation

Game assets are AI-generated via MCP servers configured in `.mcp.json`.

### MCP Servers

| Server | Purpose | Port/URL |
|--------|---------|----------|
| pixellab | Pixel art sprites/spritesheets | `https://api.pixellab.ai/mcp` |

**Config:** `.mcp.json` (gitignored - contains API keys)

### API Keys (in .env)

| Service | Env Var | Purpose |
|---------|---------|---------|
| PixelLab | `PIXELLAB_API_KEY` | Sprite generation MCP |
| AI/ML API | `AIMLAPI_KEY` | Music generation (MiniMax, Lyria 2, etc.) |

### Generating Sprites

Use PixelLab MCP tools. Example prompt for spritesheet:
```
64x64 pixel art paladin spritesheet,
8 frames, idle animation cycle,
side view facing right, golden armor holy sword,
12-color palette, clean edges,
transparent background,
game-ready export, retro SNES style
```

**Output:** `public/assets/sprites/units/{unit}.png`

### Generating Music

Use AI/ML API (aimlapi.com) with MiniMax Music or Lyria 2 models.

**Endpoint:** `https://api.aimlapi.com/v2/generate/audio`

**Example curl:**
```bash
curl -X POST 'https://api.aimlapi.com/v2/generate/audio' \
  -H "Authorization: Bearer $AIMLAPI_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "minimax-music",
    "prompt": "8-bit chiptune battle theme, fast tempo, heroic, retro game"
  }'
```

**Free tier:** 10 requests/hour (no credit card required)

**Output:** Download to `public/assets/audio/music/`

**Required tracks:** menu, battle_easy, battle_hard, boss, upgrade, victory, defeat

### Generating SFX

Use jsfxr npm package (no MCP needed):
```bash
# Create scripts/generate-sfx.ts with preset mappings
# Run to generate all SFX to public/assets/audio/sfx/
```

### Asset Beads

Epic `mini-warriors-reborn-49h` tracks all asset generation tasks:
- `.2-.11` - Player unit spritesheets (10)
- `.12-.23` - Enemy spritesheets (12)
- `.24` - Backgrounds
- `.25` - UI textures
- `.26` - Music tracks
- `.27` - SFX generation
- `.28` - PreloadScene integration
