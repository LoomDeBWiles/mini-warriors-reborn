#!/usr/bin/env node
/**
 * Generates paladin spritesheet using PixelLab API.
 * Creates 20 frames (64x64 each): idle (4), walk (8), attack (4), death (4)
 * Output: public/assets/sprites/units/paladin.png
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const API_KEY = process.env.PIXELLAB_API_KEY;
if (!API_KEY) {
  console.error('Error: PIXELLAB_API_KEY not set');
  process.exit(1);
}

const API_BASE = 'api.pixellab.ai';
const OUTPUT_PATH = path.join(__dirname, '..', 'public/assets/sprites/units/paladin.png');

function apiRequest(endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: API_BASE,
      port: 443,
      path: `/v1/${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`API error ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateBaseCharacter() {
  console.log('Generating base paladin character...');
  const response = await apiRequest('generate-image-pixflux', {
    description: 'pixel art paladin knight in shining silver armor with golden trim, blue cape, holding sword and shield, medieval fantasy warrior, heroic pose, side view',
    image_size: { width: 64, height: 64 },
    text_guidance_scale: 8,
    no_background: true,
    view: 'side',
    direction: 'east',
  });
  console.log(`Base character generated. Cost: $${response.usage.usd}`);
  return response.image;
}

async function generateAnimation(referenceImage, action, nFrames) {
  console.log(`Generating ${action} animation (${nFrames} frames)...`);
  const response = await apiRequest('animate-with-text', {
    description: 'pixel art paladin knight in shining silver armor with golden trim, blue cape, sword and shield',
    action: action,
    image_size: { width: 64, height: 64 },
    reference_image: referenceImage,
    n_frames: nFrames,
    view: 'side',
    direction: 'east',
    text_guidance_scale: 8,
    image_guidance_scale: 1.4,
  });
  const frames = response.images || [];
  console.log(`${action} animation generated. Got ${frames.length} frames. Cost: $${response.usage.usd}`);
  return frames;
}

async function createSpritesheet(frames) {
  // Create a horizontal spritesheet: 20 frames * 64px = 1280px wide, 64px tall
  const width = frames.length * 64;
  const height = 64;

  // Handle both string and object (with base64 property) formats
  const images = frames.map((frame, i) => {
    let base64Data;
    if (typeof frame === 'string') {
      base64Data = frame;
    } else if (frame && frame.base64) {
      base64Data = frame.base64;
    } else if (frame && frame.image) {
      base64Data = frame.image;
    } else {
      console.log(`Frame ${i} format:`, typeof frame, frame ? Object.keys(frame) : 'null');
      throw new Error(`Unknown frame format at index ${i}`);
    }
    return {
      input: Buffer.from(base64Data, 'base64'),
      left: i * 64,
      top: 0,
    };
  });

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(images)
    .png()
    .toFile(OUTPUT_PATH);

  console.log(`Spritesheet saved to ${OUTPUT_PATH}`);
}

async function main() {
  console.log('Starting paladin spritesheet generation...');

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate base character
  const baseImage = await generateBaseCharacter();

  // Generate animations
  // API returns max 4 frames per call, so we need multiple calls for walk
  // Idle: 4 frames, Walk: 4+4 frames, Attack: 4 frames, Death: 4 frames = 20 total
  const idleFrames = await generateAnimation(baseImage, 'idle stance breathing gently', 4);
  const walkFrames1 = await generateAnimation(baseImage, 'walking forward first step', 4);
  const walkFrames2 = await generateAnimation(baseImage, 'walking forward second step', 4);
  const attackFrames = await generateAnimation(baseImage, 'sword attack swing slash', 4);
  const deathFrames = await generateAnimation(baseImage, 'dying falling down collapse', 4);

  // Combine all frames into spritesheet
  const allFrames = [...idleFrames, ...walkFrames1, ...walkFrames2, ...attackFrames, ...deathFrames];
  console.log(`Total frames: ${allFrames.length}`);

  await createSpritesheet(allFrames);

  console.log('Done!');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
