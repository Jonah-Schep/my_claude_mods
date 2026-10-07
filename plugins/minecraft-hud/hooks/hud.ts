// Lays out the survival HUD exactly as vanilla's Gui does, on a 182x25 canvas
// whose origin is the hotbar's left edge, 49 pixels above the screen's bottom.

import type { Sprite } from './sprites'
import {
  armorEmpty,
  armorFull,
  armorHalf,
  digits,
  experienceBarBackground,
  experienceBarProgress,
  foodEmpty,
  foodFull,
  foodHalf,
  heartContainer,
  heartContainerHardcore,
  heartFull,
  heartHalf,
  heartHardcoreFull,
  heartHardcoreHalf,
} from './sprites'

import type { Hud } from '../types'

export const WIDTH = 182
export const HEIGHT = 25

// Rows on the canvas: vanilla's height - 49, - 39, - 35 and - 29.
const ARMOR_Y = 0
const HEARTS_Y = 10
const LEVEL_Y = 14
const XP_Y = 20

const LEVEL_COLOR = '80ff20'
const SHADOW_COLOR = '000000'

/** One hex color per pixel, row-major, null where nothing is drawn. */
export type Canvas = (string | null)[]

function blit(canvas: Canvas, sprite: Sprite, x: number, y: number, width = sprite.w) {
  for (let row = 0; row < sprite.h; row++) {
    for (let col = 0; col < Math.min(width, sprite.w); col++) {
      const color = sprite.px.slice((row * sprite.w + col) * 6, (row * sprite.w + col) * 6 + 6)
      const cx = x + col
      const cy = y + row
      if (color === '......' || cx < 0 || cx >= WIDTH || cy < 0 || cy >= HEIGHT) continue
      canvas[cy * WIDTH + cx] = color
    }
  }
}

function text(canvas: Canvas, value: string, x: number, y: number, color: string) {
  let pen = x
  for (const ch of value) {
    const glyph = digits[ch.charCodeAt(0) - 48]
    if (!glyph) continue
    glyph.rows.forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx++) {
        const cx = pen + gx
        const cy = y + gy
        if (row[gx] === '#' && cx >= 0 && cx < WIDTH && cy >= 0 && cy < HEIGHT) {
          canvas[cy * WIDTH + cx] = color
        }
      }
    })
    pen += glyph.w + 1
  }
}

function textWidth(value: string): number {
  let width = 0
  for (const ch of value) width += (digits[ch.charCodeAt(0) - 48]?.w ?? 0) + 1
  return width
}

/** Half-icon points (0-20) left from a usage percentage: 0% used is 20. */
export function pointsLeft(percentUsed: number): number {
  const left = Math.max(0, Math.min(100, 100 - percentUsed))
  return Math.ceil(left / 5)
}

export function compose(hud: Hud): Canvas {
  const canvas: Canvas = new Array(WIDTH * HEIGHT).fill(null)

  // Armor: left to right, each over the last's right column; hidden at 0.
  if (hud.armor !== null && hud.armor > 0) {
    for (let i = 0; i < 10; i++) {
      const sprite = i * 2 + 1 < hud.armor ? armorFull : i * 2 + 1 === hud.armor ? armorHalf : armorEmpty
      blit(canvas, sprite, i * 8, ARMOR_Y)
    }
  }

  // Hearts: drawn from the tenth down, so each lies over its right neighbour.
  const container = hud.isHardcore ? heartContainerHardcore : heartContainer
  const full = hud.isHardcore ? heartHardcoreFull : heartFull
  const half = hud.isHardcore ? heartHardcoreHalf : heartHalf
  for (let i = 9; i >= 0; i--) {
    blit(canvas, container, i * 8, HEARTS_Y)
    if (i * 2 + 1 < hud.health) blit(canvas, full, i * 8, HEARTS_Y)
    else if (i * 2 + 1 === hud.health) blit(canvas, half, i * 8, HEARTS_Y)
  }

  // Food: right to left from the hotbar's right edge.
  for (let k = 0; k < 10; k++) {
    const x = WIDTH - k * 8 - 9
    blit(canvas, foodEmpty, x, HEARTS_Y)
    if (k * 2 + 1 < hud.food) blit(canvas, foodFull, x, HEARTS_Y)
    else if (k * 2 + 1 === hud.food) blit(canvas, foodHalf, x, HEARTS_Y)
  }

  // Experience bar, then the level over it with its four-way black outline.
  blit(canvas, experienceBarBackground, 0, XP_Y)
  const filled = Math.floor(Math.max(0, Math.min(1, hud.xp)) * 183)
  if (filled > 0) blit(canvas, experienceBarProgress, 0, XP_Y, filled)

  if (hud.level > 0) {
    const label = String(hud.level)
    const x = Math.floor(91 - textWidth(label) / 2)
    text(canvas, label, x + 1, LEVEL_Y, SHADOW_COLOR)
    text(canvas, label, x - 1, LEVEL_Y, SHADOW_COLOR)
    text(canvas, label, x, LEVEL_Y + 1, SHADOW_COLOR)
    text(canvas, label, x, LEVEL_Y - 1, SHADOW_COLOR)
    text(canvas, label, x, LEVEL_Y, LEVEL_COLOR)
  }

  return canvas
}

/** The canvas as crisp pixel-art SVG: one path per color, one run per subpath. */
export function toSvg(canvas: Canvas, scale: number): string {
  const runs = new Map<string, string[]>()
  for (let y = 0; y < HEIGHT; y++) {
    let x = 0
    while (x < WIDTH) {
      const color = canvas[y * WIDTH + x] ?? null
      let end = x + 1
      while (end < WIDTH && canvas[y * WIDTH + end] === color) end++
      if (color !== null) {
        const list = runs.get(color) ?? []
        list.push(`M${x} ${y}h${end - x}v1h-${end - x}z`)
        runs.set(color, list)
      }
      x = end
    }
  }
  const paths = [...runs].map(([color, d]) => `<path fill="#${color}" d="${d.join('')}"/>`).join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
    `width="${WIDTH * scale}" height="${HEIGHT * scale}" shape-rendering="crispEdges">${paths}</svg>`
  )
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function base64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    out += BASE64.charAt(a >> 2) + BASE64.charAt(((a & 3) << 4) | (b >> 4))
    out += i + 1 < bytes.length ? BASE64.charAt(((b & 15) << 2) | (c >> 6)) : '='
    out += i + 2 < bytes.length ? BASE64.charAt(c & 63) : '='
  }
  return out
}

const DEFAULT_COLOR = 0x01000000
const UPPER_HALF = 0x2580
const LOWER_HALF = 0x2584
const SPACE = 0x20

/**
 * The canvas as terminal cells: two pixels per cell with half blocks, scaled
 * down nearest-neighbour when the band is narrower than 182 columns.
 */
export function toRaster(canvas: Canvas, maxColumns: number) {
  const columns = Math.max(1, Math.min(WIDTH, maxColumns))
  const factor = columns / WIDTH
  const height = Math.max(2, Math.round(HEIGHT * factor))
  const rows = Math.ceil(height / 2)
  const pixel = (x: number, y: number): string | null =>
    y >= height ? null : canvas[Math.min(HEIGHT - 1, Math.floor(y / factor)) * WIDTH + Math.min(WIDTH - 1, Math.floor(x / factor))] ?? null
  const words = new Uint32Array(columns * rows * 3)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const top = pixel(col, row * 2)
      const bottom = pixel(col, row * 2 + 1)
      const at = (row * columns + col) * 3
      if (top === null) {
        words.set(bottom === null ? [SPACE, DEFAULT_COLOR, DEFAULT_COLOR] : [LOWER_HALF, parseInt(bottom, 16), DEFAULT_COLOR], at)
      } else {
        words.set([UPPER_HALF, parseInt(top, 16), bottom === null ? DEFAULT_COLOR : parseInt(bottom, 16)], at)
      }
    }
  }
  return { columns, rows, cells: base64(new Uint8Array(words.buffer)) }
}
