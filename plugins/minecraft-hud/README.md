# minecraft-hud

The vanilla Minecraft survival HUD, drawn above the Claude Code prompt from the game's own sprites and laid out as the game's `Gui` lays it out.

| HUD | Shows | Full means |
| --- | --- | --- |
| Hearts | Weekly (`seven_day`) limit | 0% used |
| Hunger | 5-hour (`five_hour`) limit | 0% used |
| Armor | Fable limit | 0% used; hidden at zero or with no reading, as zero armor is in game |
| XP bar and level | Context window left | Empty window: full bar, level 100 |

It refreshes after every turn and every 15 seconds, and remembers the last limit readings so a new session does not start blank. `/hud` prints the figures behind it and every rate-limit kind the session reported.

In the desktop app it draws as pixel-art SVG; in a terminal as half-block cells.

## Options

| Option | Default | |
| --- | --- | --- |
| `hardcore` | `false` | Hardcore-world hearts |
| `scale` | `3` | Pixels per Minecraft pixel in the desktop app, like GUI Scale |

Tested with Claude Code 2.1.291.

The HUD textures and font glyphs in `hooks/sprites.ts` are Minecraft's, © Mojang Studios; not an official Minecraft product, not approved by or associated with Mojang or Microsoft.
