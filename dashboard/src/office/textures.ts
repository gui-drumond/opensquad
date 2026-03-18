import { Texture, CanvasSource } from "pixi.js";
import { COLORS, CharacterColors } from "./palette";

function hexToRgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

// 1 pixel per logical pixel — SCENE_SCALE=2 handles display scaling
function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: number) {
  const [r, g, b] = hexToRgb(color);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(x, y, 1, 1);
}

function hspan(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: number) {
  for (let x = x1; x <= x2; x++) px(ctx, x, y, color);
}

function drawCharacterIdle(ctx: CanvasRenderingContext2D, c: CharacterColors) {
  // --- HAIR (rows 2-7) ---
  hspan(ctx, 16, 30, 2, c.hair);
  hspan(ctx, 15, 31, 3, c.hair);
  hspan(ctx, 14, 32, 4, c.hair);
  hspan(ctx, 14, 32, 5, c.hair);
  px(ctx, 17, 3, c.hairLight); px(ctx, 20, 3, c.hairLight);
  px(ctx, 25, 4, c.hairLight); px(ctx, 28, 3, c.hairLight);
  px(ctx, 16, 4, c.hairLight); px(ctx, 22, 4, c.hairLight); px(ctx, 30, 4, c.hairLight);
  px(ctx, 14, 5, c.hairDark); px(ctx, 32, 5, c.hairDark);
  px(ctx, 15, 4, c.hairDark); px(ctx, 31, 4, c.hairDark);
  px(ctx, 14, 6, c.hair); px(ctx, 14, 7, c.hair);
  px(ctx, 32, 6, c.hair); px(ctx, 32, 7, c.hair);

  // --- FACE (rows 6-14) ---
  hspan(ctx, 15, 31, 6, c.skin);
  hspan(ctx, 15, 31, 7, c.skin);
  hspan(ctx, 15, 31, 8, c.skin);
  hspan(ctx, 15, 31, 9, c.skin);
  hspan(ctx, 16, 30, 10, c.skin);
  hspan(ctx, 16, 30, 11, c.skin);
  hspan(ctx, 17, 29, 12, c.skin);
  hspan(ctx, 18, 28, 13, c.skin);
  hspan(ctx, 19, 27, 14, c.skin);
  for (let i = 16; i <= 17; i++) { px(ctx, i, 11, c.skinShadow); px(ctx, i, 12, c.skinShadow); }
  for (let i = 29; i <= 30; i++) { px(ctx, i, 11, c.skinShadow); px(ctx, i, 12, c.skinShadow); }
  px(ctx, 18, 13, c.skinShadow); px(ctx, 19, 13, c.skinShadow);
  px(ctx, 27, 13, c.skinShadow); px(ctx, 28, 13, c.skinShadow);

  // Eyebrows
  hspan(ctx, 18, 20, 7, c.hairDark);
  hspan(ctx, 26, 28, 7, c.hairDark);

  // Eyes (white + pupil)
  px(ctx, 18, 9, 0xf0ede8); px(ctx, 19, 9, 0x2a2018); px(ctx, 20, 9, 0xf0ede8);
  px(ctx, 26, 9, 0xf0ede8); px(ctx, 27, 9, 0x2a2018); px(ctx, 28, 9, 0xf0ede8);

  // Nose
  px(ctx, 23, 11, c.skinShadow); px(ctx, 23, 12, c.skinShadow);

  // Mouth (neutral)
  hspan(ctx, 21, 25, 14, 0x2a2018);

  // Ears
  px(ctx, 14, 8, c.skin); px(ctx, 14, 9, c.skinShadow);
  px(ctx, 32, 8, c.skin); px(ctx, 32, 9, c.skinShadow);

  // --- NECK (rows 15-16) ---
  hspan(ctx, 20, 26, 15, c.skin);
  hspan(ctx, 21, 25, 16, c.skin);
  px(ctx, 20, 15, c.skinShadow); px(ctx, 26, 15, c.skinShadow);

  // --- COLLAR (row 17) ---
  hspan(ctx, 17, 29, 17, COLORS.collarWhite);
  px(ctx, 22, 17, 0xe0e0e0); px(ctx, 23, 17, 0xe0e0e0); px(ctx, 24, 17, 0xe0e0e0);

  // --- SHIRT (rows 18-28) ---
  for (let y = 18; y <= 28; y++) {
    for (let i = 13; i <= 33; i++) {
      if (i <= 15) px(ctx, i, y, c.shirtDark);
      else if (i >= 31) px(ctx, i, y, c.shirtDark);
      else if (i >= 22 && i <= 24) px(ctx, i, y, c.shirtLight);
      else px(ctx, i, y, c.shirt);
    }
  }

  // --- ARMS at sides ---
  for (let y = 18; y <= 22; y++) { px(ctx, 11, y, c.shirt); px(ctx, 12, y, c.shirt); }
  px(ctx, 12, 19, c.shirtDark); px(ctx, 12, 20, c.shirtDark);
  for (let y = 23; y <= 27; y++) { px(ctx, 10, y, c.skin); px(ctx, 11, y, c.skin); }
  px(ctx, 8, 28, c.skin); px(ctx, 9, 28, c.skin); px(ctx, 10, 28, c.skin);
  px(ctx, 8, 29, c.skin); px(ctx, 9, 29, c.skinShadow);
  for (let y = 18; y <= 22; y++) { px(ctx, 34, y, c.shirt); px(ctx, 35, y, c.shirt); }
  px(ctx, 34, 19, c.shirtDark); px(ctx, 34, 20, c.shirtDark);
  for (let y = 23; y <= 27; y++) { px(ctx, 35, y, c.skin); px(ctx, 36, y, c.skin); }
  px(ctx, 36, 28, c.skin); px(ctx, 37, 28, c.skin); px(ctx, 38, 28, c.skin);
  px(ctx, 37, 29, c.skin); px(ctx, 38, 29, c.skinShadow);

  // --- BELT (row 29) ---
  hspan(ctx, 13, 33, 29, c.pantsDark);
  px(ctx, 22, 29, COLORS.beltBuckle); px(ctx, 23, 29, COLORS.beltBuckle); px(ctx, 24, 29, COLORS.beltBuckle);

  // --- PANTS (rows 30-39) ---
  for (let y = 30; y <= 39; y++) {
    for (let i = 14; i <= 21; i++) px(ctx, i, y, i <= 15 ? c.pantsDark : c.pants);
    for (let i = 25; i <= 32; i++) px(ctx, i, y, i >= 31 ? c.pantsDark : c.pants);
    px(ctx, 21, y, c.pantsDark); px(ctx, 25, y, c.pantsDark);
  }

  // --- SHOES (rows 40-43) ---
  for (let i = 13; i <= 22; i++) { px(ctx, i, 40, c.shoe); px(ctx, i, 41, c.shoe); }
  for (let i = 13; i <= 22; i++) px(ctx, i, 42, i <= 14 ? c.shoeLight : c.shoe);
  hspan(ctx, 13, 22, 43, c.shoeLight);
  for (let i = 24; i <= 33; i++) { px(ctx, i, 40, c.shoe); px(ctx, i, 41, c.shoe); }
  for (let i = 24; i <= 33; i++) px(ctx, i, 42, i >= 32 ? c.shoeLight : c.shoe);
  hspan(ctx, 24, 33, 43, c.shoeLight);
}

function drawCharacterWorking(ctx: CanvasRenderingContext2D, c: CharacterColors, _frame: 0 | 1) {
  drawCharacterIdle(ctx, c);
}
function drawCharacterDone(ctx: CanvasRenderingContext2D, c: CharacterColors) {
  drawCharacterIdle(ctx, c);
}

export interface CharacterTextures {
  idle: Texture;
  working: [Texture, Texture];
  done: Texture;
  checkpoint: Texture;
}

export function generateCharacterTextures(colors: CharacterColors): CharacterTextures {
  const size = 48;

  function makeFrame(drawFn: (ctx: CanvasRenderingContext2D) => void): Texture {
    const [canvas, ctx] = createCanvas(size, size);
    drawFn(ctx);
    return new Texture({ source: new CanvasSource({ resource: canvas, scaleMode: "nearest" }) });
  }

  return {
    idle: makeFrame((ctx) => drawCharacterIdle(ctx, colors)),
    working: [
      makeFrame((ctx) => drawCharacterWorking(ctx, colors, 0)),
      makeFrame((ctx) => drawCharacterWorking(ctx, colors, 1)),
    ],
    done: makeFrame((ctx) => drawCharacterDone(ctx, colors)),
    checkpoint: makeFrame((ctx) => drawCharacterIdle(ctx, colors)),
  };
}

const textureCache = new Map<number, CharacterTextures>();

export function getCharacterTextures(variantIndex: number, colors: CharacterColors): CharacterTextures {
  if (!textureCache.has(variantIndex)) {
    textureCache.set(variantIndex, generateCharacterTextures(colors));
  }
  return textureCache.get(variantIndex)!;
}
