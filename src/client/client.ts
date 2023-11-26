import type { Connection } from "../connection";
import { Endpoint } from "../endpoint";
import type { EventRegistry } from "../event";
import { EventType } from "../event";
import { ExtensionRegistry } from "../extension";

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
