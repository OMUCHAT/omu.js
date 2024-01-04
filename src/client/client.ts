import type { Connection } from '../connection/index.js';
import type { EventRegistry, EventType } from '../event/index.js';
import type { EndpointExtension } from '../extension/endpoint/index.js';
import type { App, ExtensionRegistry, MessageExtension, RegistryExtension, ServerExtension, TableExtension } from '../extension/index.js';

export interface ClientListener {
    onInitialized?(): void;
    onStarted?(): void;
    onStopped?(): void;
    onReady?(): void;
}

export interface Client {
    readonly app: App;
    readonly connection: Connection;
    readonly events: EventRegistry;
    readonly extensions: ExtensionRegistry;
    readonly endpoints: EndpointExtension;
    readonly tables: TableExtension;
    readonly registry: RegistryExtension;
    readonly message: MessageExtension;
    readonly server: ServerExtension;
    readonly running: boolean;

    start(): void;
    stop(): void;
    send<T, D>(type: EventType<T, D>, data: T): void;
    proxy(url: string): string;
    asset(url: string): string;

    addListener(listener: ClientListener): void;
    removeListener(listener: ClientListener): void;
}
