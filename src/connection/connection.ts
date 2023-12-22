import type { ClientListener } from '../client';
import type { EventJson } from '../event';

import type { Address } from './address';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface Connection extends ClientListener {
    readonly address: Address;
    readonly connected: boolean;

    connect(): void;
    disconnect(): void;
    send(event: EventJson): void;
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
    onEvent?(event: EventJson): void;
    onStatusChanged?(status: ConnectionStatus): void;
}
