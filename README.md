# PlatformSpoof

Spoofs your Discord gateway platform so others see a different client icon on your profile.

## Platforms

| Option | Shows as |
|---|---|
| Off | your real client |
| Desktop (Windows) | Desktop: Online |
| Web / Browser | Web: Online |
| Mobile (Discord Android) | Mobile: Online |
| Meta Quest / VR | VR: Online |
| Console | Console: Online |

## How it works

Discord sends an IDENTIFY payload (op 2) to the gateway on every connection containing `os`, `browser`, and `device` fields. These determine the platform shown to others.

The plugin patches `socket.send()` to intercept every IDENTIFY before it's packed and sent, swapping those fields with the spoofed values. It also nulls `sessionId` before reconnecting to force a full IDENTIFY instead of a RESUME (RESUME doesn't re-send properties).

Changing the platform dropdown reconnects automatically — no restart needed.
