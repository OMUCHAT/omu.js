import { ClientListener } from "../client";
import type { EventJson } from "../event/event";

export interface ServerAddress {
    host: string;
    port: number;
    secure: boolean;
}

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface Connection extends ClientListener {
    readonly address: ServerAddress;
    readonly connected: boolean;

    connect(): void;
    close(): void;
    send(event: EventJson): void;
    status(): ConnectionStatus;

    on(listener: ConnectionListener): void;
    off(listener: ConnectionListener): void;
}

export interface ConnectionListener {
    onConnect?(): void;
    onDisconnect?(): void;
    onEvent?(event: EventJson): void;
    onStatusChange?(status: ConnectionStatus): void;
}
