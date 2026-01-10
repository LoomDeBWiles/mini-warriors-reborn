#!/usr/bin/env node
/**
 * Creates swordsman spritesheet from extracted PixelLab Warrior animations.
 * Uses east-facing direction frames.
 * Output: public/assets/sprites/units/swordsman.png
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTRACTED_PATH = '/tmp/swordsman_extract';
const OUTPUT_PATH = path.join(__dirname, '..', 'public/assets/sprites/units/swordsman.png');

function getFrames(animationName, direction = 'east', maxFrames = null) {
  const animDir = path.join(EXTRACTED_PATH, 'animations', animationName, direction);
  if (!fs.existsSync(animDir)) {
    throw new Error(`Animation directory not found: ${animDir}`);
  }
  let files = fs.readdirSync(animDir)
    .filter(f => f.endsWith('.png'))
    .sort();
  if (maxFrames !== null && files.length > maxFrames) {
    files = files.slice(0, maxFrames);
  }
  return files.map(f => path.join(animDir, f));
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
  console.log('Creating swordsman spritesheet...');

  // Target: 20 frames total (4 idle + 4 walk + 6 attack + 6 death)
  const idleFrames = getFrames('breathing-idle', 'east');
  const walkFrames = getFrames('walking-4-frames', 'east');
  const attackFrames = getFrames('cross-punch', 'east');
  const deathFrames = getFrames('falling-back-death', 'east', 6); // Limit to 6 frames to hit 20 total

  console.log(`Idle: ${idleFrames.length} frames`);
  console.log(`Walk: ${walkFrames.length} frames`);
  console.log(`Attack: ${attackFrames.length} frames`);
  console.log(`Death: ${deathFrames.length} frames`);

  const allFrames = [...idleFrames, ...walkFrames, ...attackFrames, ...deathFrames];
  console.log(`Total: ${allFrames.length} frames`);

  if (allFrames.length !== 20) {
    console.warn(`Warning: Expected 20 frames, got ${allFrames.length}`);
  }

  await createSpritesheet(allFrames);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
