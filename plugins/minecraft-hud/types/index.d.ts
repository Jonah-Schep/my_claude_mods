/** The usage figures the HUD draws, each a percentage used, null before any reading. */
export type Readings = {
  /** The weekly (seven_day) limit: the hearts. */
  sevenDay: number | null
  /** The session (five_hour) limit: the hunger bar. */
  fiveHour: number | null
  /** The Fable limit: the armor bar. */
  fable: number | null
  /** The context window: the experience bar and level. */
  context: number | null
  /** Every rate-limit kind the last reading carried. */
  kinds: string[]
}

/** What the HUD draws: half-icon points 0-20, experience 0-1, the level number. */
export type Hud = {
  health: number
  food: number
  armor: number | null
  xp: number
  level: number
  isHardcore: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'minecraft-hud': { readings: Readings }
  }
}
