import { describe, expect, mock, test } from 'claude-code/testing'

import { compose, pointsLeft, WIDTH } from '../hooks/hud'
import { toHud } from '../hooks/register'

// A band site's props, as the engine would hand them
const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns: 200,
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const USAGE = {
  startedAt: 0,
  context: { tokens: 84_000, window: 200_000, percent: 42 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 65 },
    { kind: 'seven_day', percentUsed: 35 },
    { kind: 'seven_day_overage_included', percentUsed: 55 },
  ],
}

describe('mapping', () => {
  test('a percentage used becomes half-icon points left', async () => {
    expect(pointsLeft(0)).toBe(20)
    expect(pointsLeft(35)).toBe(13)
    expect(pointsLeft(100)).toBe(0)
    expect(pointsLeft(130)).toBe(0)
  })

  test('readings map to hearts, hunger, armor and experience', async () => {
    const hud = toHud({ sevenDay: 35, fiveHour: 65, fable: 55, context: 42, kinds: [] }, false)
    expect(hud).toEqual({ health: 13, food: 7, armor: 9, xp: 0.58, level: 58, isHardcore: false })
  })

  test('an empty context window is a full bar at level 100', async () => {
    const hud = toHud({ sevenDay: 0, fiveHour: 0, fable: 0, context: 0, kinds: [] }, false)
    expect(hud.xp).toBe(1)
    expect(hud.level).toBe(100)
  })

  test('no Fable reading hides the armor row, as zero armor does in game', async () => {
    const canvas = compose(toHud({ sevenDay: 0, fiveHour: 0, fable: null, context: 0, kinds: [] }, false))
    expect(canvas.slice(0, WIDTH * 9).every(p => p === null)).toBe(true)
  })
})

describe('band', () => {
  test('draws the HUD from the session usage on each surface', async ($, on) => {
    mock.clock(on)
    mock.store(on, {})
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('command.register', ($, e) => ({ value: { command: e.name } }))
    on('session.usage', () => ({ value: USAGE }))

    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

    const terminal = await $.ui.mount({ plugin: 'minecraft-hud', surface: 'terminal', ...BAND })
    const raster = await terminal.find({ type: 'Raster', key: 'hud' })
    expect(raster?.props.columns).toBe(182)
    expect(raster?.props.rows).toBe(13)
    await terminal.unmount()

    const desktop = await $.ui.mount({ plugin: 'minecraft-hud', surface: 'desktop', ...BAND })
    const svg = await desktop.find({ type: 'Svg' })
    expect(String(svg?.props.source)).toContain('viewBox="0 0 182 25"')
    expect(String(svg?.props.source)).toContain('#80ff20')
    await desktop.unmount()
  })
})
