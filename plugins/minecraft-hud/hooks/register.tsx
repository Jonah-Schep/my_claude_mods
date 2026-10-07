import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import { compose, pointsLeft, toRaster, toSvg, HEIGHT, WIDTH } from './hud'
import type { Hud, Readings } from '../types'

const EMPTY: Readings = { sevenDay: null, fiveHour: null, fable: null, context: null, kinds: [] }
const readings = atom({ plugin: 'minecraft-hud', key: 'readings' } as const, EMPTY)

const STORE_KEY = 'last-readings'
const REFRESH_MS = 15_000

// The Fable bucket is `seven_day_overage_included`, which the CLI labels "Fable limit".
function isFable(limit: SessionRateLimit): boolean {
  return /fable|overage_included/i.test(limit.kind)
}

function percentOf(limits: SessionRateLimit[], test: (limit: SessionRateLimit) => boolean): number | null {
  return limits.find(test)?.percentUsed ?? null
}

async function refresh($: EngineInterface) {
  const usage = await $.session.usage()
  const limits = usage.rateLimits
  const stored = ((await $.store.get(STORE_KEY)) ?? EMPTY) as Readings
  const next: Readings = {
    sevenDay: percentOf(limits, l => l.kind === 'seven_day') ?? stored.sevenDay,
    fiveHour: percentOf(limits, l => l.kind === 'five_hour') ?? stored.fiveHour,
    fable: percentOf(limits, isFable) ?? stored.fable,
    context: usage.context.percent ?? null,
    kinds: limits.length > 0 ? limits.map(l => l.kind) : stored.kinds,
  }
  await $.store.set(STORE_KEY, { ...next, context: null })
  await update($, readings, () => next)
}

export function toHud(r: Readings, isHardcore: boolean): Hud {
  // Experience is the context left: an empty window is a full bar at level 100.
  const contextLeft = Math.max(0, Math.min(100, 100 - (r.context ?? 0)))
  return {
    health: r.sevenDay === null ? 20 : pointsLeft(r.sevenDay),
    food: r.fiveHour === null ? 20 : pointsLeft(r.fiveHour),
    armor: r.fable === null ? null : pointsLeft(r.fable),
    xp: contextLeft / 100,
    level: Math.round(contextLeft),
    isHardcore,
  }
}

function describe(r: Readings): string {
  const show = (n: number | null) => (n === null ? 'no reading yet' : `${n}% used`)
  return [
    `Hearts (weekly limit): ${show(r.sevenDay)}`,
    `Hunger (5-hour limit): ${show(r.fiveHour)}`,
    `Armor (Fable limit): ${show(r.fable)}`,
    `XP (context left): ${r.context === null ? 'no reading yet' : `${Math.round(100 - r.context)} levels (${r.context}% used)`}`,
    `Rate-limit kinds seen: ${r.kinds.length > 0 ? r.kinds.join(', ') : 'none yet'}`,
  ].join('\n')
}

export const register: Register = (on, options) => {
  const isHardcore = options.hardcore === true
  const scale = typeof options.scale === 'number' && options.scale > 0 ? options.scale : 3

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'hud', description: 'Show the figures behind the Minecraft HUD' })
    await refresh($)
    $.clock.every(REFRESH_MS, () => void refresh($))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    await refresh($)

    return done
  })

  on('command.run', { command: 'hud' }, async $ => {
    await refresh($)

    return { text: describe(await read($, readings)) }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const canvas = compose(toHud(await read($, readings), isHardcore))
    const alt = 'Minecraft HUD: hearts, hunger, armor and experience'

    if (e.surface === 'terminal') {
      const { Box, Raster } = $.ui.resolve(e)
      const raster = toRaster(canvas, e.props.bodyColumns)

      return (
        <Box justifyContent="center">
          <Raster key="hud" columns={raster.columns} rows={raster.rows} cells={raster.cells} />
        </Box>
      )
    }

    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box justifyContent="center">
        <Svg source={toSvg(canvas, scale)} alt={alt} width={WIDTH * scale} height={HEIGHT * scale} />
      </Box>
    )
  })
}
