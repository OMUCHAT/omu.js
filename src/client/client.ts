import type { Connection } from '../connection';
import type { EventRegistry, EventType } from '../event';
import type { ExtensionRegistry, ServerExtension, TableExtension } from '../extension';
import type { EndpointExtension } from '../extension/endpoint';

export interface ClientListener {
    onInitialized?(): void;
    onStarted?(): void;
    onStopped?(): void;
}

export interface Client {
    readonly connection: Connection;
    readonly events: EventRegistry;
    readonly extensions: ExtensionRegistry;
    readonly endpoints: EndpointExtension;
    readonly tables: TableExtension;
    readonly server: ServerExtension;
    readonly running: boolean;

    start(): void;
    stop(): void;
    send<T, D>(type: EventType<T, D>, data: T): void;

    addListener(listener: ClientListener): void;
    removeListener(listener: ClientListener): void;
}
