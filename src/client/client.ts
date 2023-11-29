import type { Connection } from '../connection';
import type { Endpoint } from '../endpoint';
import type { EventRegistry, EventType } from '../event';
import type { ExtensionRegistry } from '../extension';

export interface ClientListener {
    onInitialized?(): void;
    onStarted?(): void;
    onStopped?(): void;
}

export interface Client {
    readonly connection: Connection;
    readonly endpoint: Endpoint;
    readonly events: EventRegistry;
    readonly extensions: ExtensionRegistry;
    readonly running: boolean;

    start(): void;
    stop(): void;
    send<T, D>(type: EventType<T, D>, data: T): void;

    addListener(listener: ClientListener): void;
    removeListener(listener: ClientListener): void;
}
