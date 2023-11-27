import { ClientListener } from "../client";
import type { EventJson } from "../event";

import { Address } from "./address";


export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export interface Connection extends ClientListener {
    readonly address: Address;
    readonly connected: boolean;

    connect(): void;
    disconnect(): void;
    send(event: EventJson): void;
    status(): ConnectionStatus;

    addListener(listener: ConnectionListener): void;
    removeListener(listener: ConnectionListener): void;
}

export interface ConnectionListener {
    onConnect?(): void;
    onDisconnect?(): void;
    onEvent?(event: EventJson): void;
    onStatusChanged?(status: ConnectionStatus): void;
}
