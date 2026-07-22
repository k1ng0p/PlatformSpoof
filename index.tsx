/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps } from "@webpack";

const IDENTIFY = 2;

type Platform = "off" | "desktop" | "web" | "mobile" | "meta" | "console";

const settings = definePluginSettings({
    platform: {
        type: OptionType.SELECT,
        description: "Platform to spoof as",
        default: "mobile",
        restartNeeded: false,
        options: [
            { label: "Off",                                value: "off"     },
            { label: "Desktop (Windows)",                  value: "desktop" },
            { label: "Web / Browser (Chrome)",             value: "web"     },
            { label: "Mobile (Discord Android)",           value: "mobile"  },
            { label: "Meta Quest / VR → VR: Online",       value: "meta"    },
            { label: "Console",                            value: "console" },
        ],
        onChange: () => forceIdentify(),
    },
});

function getSpoofProps(): Record<string, string> | null {
    switch (settings.store.platform as Platform) {
        case "desktop": return { os: "Windows",     browser: "Discord Client",   device: "" };
        case "web":     return { os: "Linux",       browser: "Chrome",           device: "" };
        case "mobile":  return { os: "Android",     browser: "Discord Android",  device: "Discord Android" };
        case "meta":    return { os: "Android",     browser: "Discord VR",       device: "Meta Quest" };
        case "console": return { os: "Playstation", browser: "Discord Embedded", device: "PlayStation" };
        default:        return null;
    }
}

let _origSend: Function | null = null;
let _socket: any = null;

function getSocket(): any | null {
    return findByProps("getSocket", "isConnected")?.getSocket() ?? null;
}

function patchSocket(socket: any) {
    if (!socket || socket.__psPatched) return;

    _origSend = socket.send.bind(socket);
    socket.send = function(op: number, data: any, flag?: boolean) {
        if (op === IDENTIFY && data?.properties) {
            const spoof = getSpoofProps();
            if (spoof) Object.assign(data.properties, spoof);
        }
        return _origSend!.call(this, op, data, flag);
    };

    socket.__psPatched = true;
    _socket = socket;
}

function unpatchSocket() {
    if (_socket && _origSend) {
        _socket.send = _origSend;
        delete _socket.__psPatched;
    }
    _origSend = null;
    _socket = null;
}

function forceIdentify() {
    if (settings.store.platform === "off") return;

    const socket = getSocket();
    if (!socket) return;

    if (!socket.__psPatched) {
        unpatchSocket();
        patchSocket(socket);
    }

    socket.sessionId = null;
    socket.seq = 0;

    const ws = socket.webSocket;
    if (ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING) {
        ws.close(1000);
    } else if (!ws) {
        socket.close();
        setTimeout(() => socket.connect(), 500);
    }
}

export default definePlugin({
    name: "PlatformSpoof",
    description: "Spoof your Discord client platform status",
    authors: [{ name: "k1ng_op", id: 641266820187160576n }],
    settings,
    patches: [],

    start() {
        const socket = getSocket();
        if (!socket) return void console.error("[PlatformSpoof] socket not found");

        patchSocket(socket);

        const GCS = findByProps("getSocket", "isConnected");
        if (GCS?.isConnected()) forceIdentify();

        (window as any).__ps = {
            status:    () => { const s = getSocket(); console.log("patched:", !!s?.__psPatched, "| platform:", settings.store.platform, "| session:", s?.sessionId, "| state:", s?.connectionState); },
            reconnect: () => forceIdentify(),
            sessions:  () => { const s = findByProps("getSessions")?.getSessions?.(); if (!s) return; Object.values(s).forEach((x: any) => console.log(x.sessionId?.slice(0, 8), "→", x.clientInfo?.client, "/", x.clientInfo?.os)); },
        };
    },

    stop() {
        unpatchSocket();
        delete (window as any).__ps;
    },
});
