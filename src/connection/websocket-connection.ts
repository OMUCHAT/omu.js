import type { EventJson } from '../event';

import type { Address } from './address';
import type { Connection, ConnectionListener, ConnectionStatus } from './connection';

export class WebsocketConnection implements Connection {
    public connected: boolean;
    readonly address: Address;
    private readonly listeners: ConnectionListener[] = [];
    private socket: WebSocket | null;
    private tasks: (() => void)[] = [];

    constructor(address: Address) {
        this.address = address;
        this.connected = false;
        this.socket = null;
    }

    connect(): void {
        if (this.socket && !this.connected) {
            throw new Error('Already connecting');
        }
        this.disconnect();
        this.socket = new WebSocket(this.wsEndpoint());
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
    }

    private onOpen(): void {
        this.connected = true;
        this.listeners.forEach((listener) => {
            listener.onConnect?.();
            listener.onStatusChanged?.('connected');
        });
        this.tasks.forEach((task) => task());
    }

    private onClose(): void {
        this.connected = false;
        this.disconnect();
        this.listeners.forEach((listener) => {
            listener.onDisconnect?.();
            listener.onStatusChanged?.('disconnected');
        });
    }

    private onMessage(event: MessageEvent<string>): void {
        const message = JSON.parse(event.data);
        this.listeners.forEach((listener) => {
            listener.onEvent?.(message);
        });
    }

    proxy(url: string): string {
        const protocol = this.address.secure ? 'https' : 'http';
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/proxy?url=${encodeURIComponent(url)}`;
    }

    asset(url: string): string {
        const protocol = this.address.secure ? 'https' : 'http';
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/assets?path=${encodeURIComponent(url)}`;
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    send(event: EventJson): void {
        if (!this.connected || !this.socket) {
            throw new Error('Not connected');
        }
        this.socket.send(JSON.stringify(event));
    }

    status(): ConnectionStatus {
        if (this.connected) {
            return 'connected';
        }
        if (this.socket) {
            return 'connecting';
        }
        return 'disconnected';
    }

    private wsEndpoint(): string {
        const protocol = this.address.secure ? 'wss' : 'ws';
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/ws`;
    }

    onStarted(): void {
        this.connect();
    }

    onStopped(): void {
        this.disconnect();
    }

    addListener(listener: ConnectionListener): void {
        if (this.listeners.includes(listener)) {
            throw new Error('Listener already registered');
        }
        this.listeners.push(listener);
    }

    removeListener(listener: ConnectionListener): void {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    addTask(task: () => void): void {
        if (this.tasks.includes(task)) {
            throw new Error('Task already registered');
        }
        this.tasks.push(task);
        if (this.connected) {
            task();
        }
    }

    removeTask(task: () => void): void {
        this.tasks.splice(this.tasks.indexOf(task), 1);
    }
}
