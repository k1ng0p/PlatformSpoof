# PlatformSpoof

Spoofs your Discord gateway platform so others see a different client icon on your profile.

Available for **Vencord/Equicord** and **BetterDiscord**.

## Platforms

| Option | Shows as |
|---|---|
| Off | your real client |
| Desktop (Windows) | Desktop: Online |
| Web / Browser | Web: Online |
| Mobile (Discord Android) | Mobile: Online |
| Meta Quest / VR | VR: Online |
| Console | Console: Online |

Changing the platform reconnects automatically — no restart needed.

## Installation

**Vencord**
Drop `index.tsx` into `src/userplugins/PlatformSpoof/index.tsx` and rebuild (`pnpm build`).

**BetterDiscord**
Download The Latest build From [Releases](https://github.com/k1ng0p/PlatformSpoof/releases) and Drop `PlatformSpoof.plugin.js` into your BetterDiscord plugins folder:
- Windows: `%appdata%\BetterDiscord\plugins`
- Linux: `~/.config/BetterDiscord/plugins`
- Mac: `~/Library/Application Support/BetterDiscord/plugins`

Then enable it from the Plugins tab in Discord settings.


## How it works

Discord sends an IDENTIFY payload (op 2) to the gateway on every connection containing `os`, `browser`, and `device` fields. These determine the platform shown to others.

The plugin patches `socket.send()` to intercept every IDENTIFY before it's packed and sent, swapping those fields with the spoofed values. It also nulls `sessionId` before reconnecting to force a full IDENTIFY instead of a RESUME (RESUME doesn't re-send properties).

## Console helpers

Same on both versions:

```js
__ps.status()     // patch state, current platform, session info
__ps.reconnect()  // force re-IDENTIFY manually
__ps.sessions()   // check clientInfo on all active sessions
```
