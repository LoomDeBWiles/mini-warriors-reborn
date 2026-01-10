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

## Asset Generation

Game assets are AI-generated via MCP servers configured in `.mcp.json`.

### MCP Servers

| Server | Purpose | Port/URL |
|--------|---------|----------|
| pixellab | Pixel art sprites/spritesheets | `https://api.pixellab.ai/mcp` |
| suno-mcp | Music tracks | Local Python server |

**Config:** `.mcp.json` (gitignored - contains API key)

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

Use Suno MCP workflow:
```
1. suno_open_browser({headless: true})
2. suno_login({email: "...", password: "..."})
3. suno_generate_track({prompt: "...", style: "orchestral", duration: "3:00"})
4. suno_download_track({track_id: "...", download_path: "./public/assets/audio/music"})
5. suno_close_browser()
```

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
