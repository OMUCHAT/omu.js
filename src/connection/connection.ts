import { ClientListener } from "../client";
import type { EventData } from "../event/event";

export interface ServerAddress {
    host: string;
    port: number;
    secure: boolean;
}

export interface Connection extends ClientListener {
    readonly address: ServerAddress;
    readonly connected: boolean;

    connect(): void;
    close(): void;
    send(event: EventData): void;

    on(listener: ConnectionListener): void;
    off(listener: ConnectionListener): void;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface ConnectionListener {
    onConnect?(): void;
    onDisconnect?(): void;
    onEvent?(event: EventData): void;
    onStatus?(status: ConnectionStatus): void;
}
