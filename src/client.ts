import type { Connection } from "./connection/connection";
import { Endpoint } from "./endpoint/endpoint";
import { EventType } from "./event/event";
import type { EventRegistry } from "./event/event-registry";
import { ExtensionRegistry } from "./extension/extension-registry";

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
    send<D, T>(event: EventType<D, T>, data: T): void;

    on(listener: ClientListener): void;
    off(listener: ClientListener): void;
}
