import type { EventData } from "../event/event";
import type { Connection, ConnectionListener, ServerAddress } from "./connection";

export class WebsocketConnection implements Connection {
    public connected: boolean;
    readonly address: ServerAddress;
    private readonly listeners: ConnectionListener[] = [];
    private socket: WebSocket | null;

    constructor(address: ServerAddress) {
        this.address = address;
        this.connected = false;
        this.socket = null;
    }

    send(event: EventData): void {
        if (!this.connected || !this.socket) {
            throw new Error("Not connected");
        }
        this.socket.send(JSON.stringify(event));
    }

    private wsEndpoint() {
        const protocol = this.address.secure ? "wss" : "ws";
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/api/v1/ws`;
    }

    connect() {
        this.close();
        this.socket = new WebSocket(this.wsEndpoint());
        this.socket.onopen = () => {
            this.connected = true;
            this.listeners.forEach((listener) => {
                listener.onConnect?.();
                listener.onStatus?.("connected");
            });
        };
        this.socket.onclose = () => {
            this.connected = false;
            this.listeners.forEach((listener) => {
                listener.onDisconnect?.();
                listener.onStatus?.("disconnected");
            });
        };
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.listeners.forEach((listener) => {
                listener.onEvent?.(message);
            });
        };
    }

    close() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    onStarted(): void {
        this.connect();
    }

    onStopped(): void {
        this.close();
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
