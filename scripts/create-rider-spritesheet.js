#!/usr/bin/env node
/**
 * Creates rider spritesheet from extracted PixelLab animations.
 * Uses east-facing direction frames.
 * Output: public/assets/sprites/enemies/rider.png
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTRACTED_PATH = '/tmp/rider_extract';
const OUTPUT_PATH = path.join(__dirname, '..', 'public/assets/sprites/enemies/rider.png');

function getFrames(animationName, direction = 'east') {
  const animDir = path.join(EXTRACTED_PATH, 'animations', animationName, direction);
  if (!fs.existsSync(animDir)) {
    console.warn(`Warning: ${animDir} does not exist, using west as fallback`);
    const fallbackDir = path.join(EXTRACTED_PATH, 'animations', animationName, 'west');
    if (!fs.existsSync(fallbackDir)) {
      throw new Error(`No animation found for ${animationName}`);
    }
    return getFramesFromDir(fallbackDir);
  }
  return getFramesFromDir(animDir);
}

function getFramesFromDir(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.png'))
    .sort();
  return files.map(f => path.join(dir, f));
}

async function createSpritesheet(framePaths) {
  const width = framePaths.length * 64;
  const height = 64;

  const composites = framePaths.map((framePath, i) => ({
    input: framePath,
    left: i * 64,
    top: 0,
  }));

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(OUTPUT_PATH);

  console.log(`Spritesheet saved to ${OUTPUT_PATH} (${framePaths.length} frames, ${width}x${height})`);
}

async function main() {
  console.log('Creating rider spritesheet...');

  const idleFrames = getFrames('breathing-idle', 'east');
  const walkFrames = getFrames('walking-4-frames', 'east');
  const attackFrames = getFrames('lead-jab', 'east');
  const deathFrames = getFrames('falling-back-death', 'east');

  console.log(`Idle: ${idleFrames.length} frames`);
  console.log(`Walk: ${walkFrames.length} frames`);
  console.log(`Attack: ${attackFrames.length} frames`);
  console.log(`Death: ${deathFrames.length} frames`);

  const allFrames = [...idleFrames, ...walkFrames, ...attackFrames, ...deathFrames];
  console.log(`Total: ${allFrames.length} frames`);

  await createSpritesheet(allFrames);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
