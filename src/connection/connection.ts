import type { ClientListener } from '../client/index.js';
import type { EventMessage } from '../event/event.js';

import type { Address } from './address.js';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface Connection extends ClientListener {
    readonly address: Address;
    readonly connected: boolean;

    connect(): void;
    disconnect(): void;
    send(event: EventMessage): void;
    status(): ConnectionStatus;

    proxy(url: string): string;
    asset(url: string): string;

    addListener(listener: ConnectionListener): void;
    removeListener(listener: ConnectionListener): void;
    addTask(task: () => void): void;
    removeTask(task: () => void): void;
}

export interface ConnectionListener {
    onConnect?(): void;
    onDisconnect?(): void;
    onEvent?(event: EventMessage): void;
    onStatusChanged?(status: ConnectionStatus): void;
}
