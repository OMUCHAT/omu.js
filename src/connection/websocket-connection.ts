import type { EventJson } from "../event/event";

import type { Address, Connection, ConnectionListener, ConnectionStatus } from "./connection";

export class WebsocketConnection implements Connection {
    public connected: boolean;
    readonly address: Address;
    private readonly listeners: ConnectionListener[] = [];
    private socket: WebSocket | null;

    constructor(address: Address) {
        this.address = address;
        this.connected = false;
        this.socket = null;
    }

    send(event: EventJson): void {
        if (!this.connected || !this.socket) {
            throw new Error("Not connected");
        }
        this.socket.send(JSON.stringify(event));
    }

    status(): ConnectionStatus {
        if (this.connected) {
            return "connected";
        }
        if (this.socket) {
            return "connecting";
        }
        return "disconnected";
    }

    private wsEndpoint() {
        const protocol = this.address.secure ? "wss" : "ws";
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/api/v1/ws`;
    }

    connect() {
        if (this.socket && !this.connected) {
            throw new Error("Already connecting");
        }
        this.disconnect();
        this.socket = new WebSocket(this.wsEndpoint());
        this.socket.onopen = () => {
            this.connected = true;
            this.listeners.forEach((listener) => {
                listener.onConnect?.();
                listener.onStatusChange?.("connected");
            });
        };
        this.socket.onclose = () => {
            this.connected = false;
            this.listeners.forEach((listener) => {
                listener.onDisconnect?.();
                listener.onStatusChange?.("disconnected");
            });
        };
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.listeners.forEach((listener) => {
                listener.onEvent?.(message);
            });
        };
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    onStarted(): void {
        this.connect();
    }

    onStopped(): void {
        this.disconnect();
    }

    on(listener: ConnectionListener): void {
        if (this.listeners.includes(listener)) {
            throw new Error("Listener already registered");
        }
        this.listeners.push(listener);
    }

    off(listener: ConnectionListener): void {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }
}
