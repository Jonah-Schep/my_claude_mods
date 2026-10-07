# my_claude_mods

The Claude Code mods I use, as one plugin marketplace.

| Mod | What it does | Source |
| --- | --- | --- |
| [minecraft-hud](plugins/minecraft-hud) | The vanilla Minecraft survival HUD above the prompt: hearts are the weekly limit, hunger the 5-hour limit, armor the Fable limit, the XP bar the context left | this repo |
| [heavens-feel](https://github.com/yedidyakfir/heavens-feel) | Sakura watches over the main session, Servants answer every subagent | [yedidyakfir/heavens-feel](https://github.com/yedidyakfir/heavens-feel), installed from upstream |

## Install on a new machine

Needs Claude Code 2.1.287 or newer (any current Claude Desktop). In a terminal:

```bash
claude plugin marketplace add Jonah-Schep/my_claude_mods
```

```bash
claude plugin install minecraft-hud@jonah-mods
```

```bash
claude plugin install heavens-feel@jonah-mods
```

Or at the Claude Code prompt: `/plugin marketplace add Jonah-Schep/my_claude_mods`, then `/plugin install minecraft-hud@jonah-mods`.

Restart Claude Desktop (or start a new session) after installing.

## Updating

Installed plugins are cached by version: bump `version` in the mod's `.claude-plugin/plugin.json` (and its entry in `.claude-plugin/marketplace.json`) on every change, push, then on each machine:

```bash
claude plugin marketplace update jonah-mods
```

## Working on a mod

```bash
claude --plugin-dir plugins/minecraft-hud
```

Saving a file hot-reloads it. Check a mod with `claude plugin validate plugins/<mod>` and `claude plugin test` inside its folder.
