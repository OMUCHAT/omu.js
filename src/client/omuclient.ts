
import { WebsocketConnection, type Address, type Connection, type ConnectionListener } from '../connection/index.js';
import { EVENTS, createEventRegistry, type EventRegistry, type EventType } from '../event/index.js';
import type { App, EndpointExtension, Extension, ExtensionRegistry, ExtensionType, MessageExtension, RegistryExtension, ServerExtension, TableExtension } from '../extension/index.js';
import { EndpointExtensionType, MessageExtensionType, RegistryExtensionType, ServerExtensionType, TableExtensionType, createExtensionRegistry } from '../extension/index.js';

import { type Client, type ClientListener } from './client.js';

export class OmuClient implements Client, ConnectionListener {
    readonly app: App;
    readonly address: Address;
    readonly connection: Connection;
    readonly events: EventRegistry;
    readonly extensions: ExtensionRegistry;
    readonly endpoints: EndpointExtension;
    readonly tables: TableExtension;
    readonly registry: RegistryExtension;
    readonly message: MessageExtension;
    readonly server: ServerExtension;
    readonly listeners: ClientListener[];
    public running: boolean;

    constructor(options: {
        app: App;
        address: Address;
        connection?: Connection;
        eventsRegistry?: EventRegistry;
        extensionRegistry?: ExtensionRegistry;
        extensions?: ExtensionType<Extension>[]
    }) {
        const { app, connection, eventsRegistry, extensionRegistry, extensions } = options;
        this.running = false;
        this.listeners = [];
        this.app = app;
        this.address = options.address;
        this.connection = connection ?? new WebsocketConnection(options.address);
        this.connection.addListener(this);
        this.events = eventsRegistry ?? createEventRegistry(this);
        this.extensions = extensionRegistry ?? createExtensionRegistry(this);

        this.events.register(EVENTS.Ready);
        this.tables = this.extensions.register(TableExtensionType);
        this.endpoints = this.extensions.register(EndpointExtensionType);
        this.server = this.extensions.register(ServerExtensionType);
        this.registry = this.extensions.register(RegistryExtensionType);
        this.message = this.extensions.register(MessageExtensionType);
        if (extensions) {
            this.extensions.registerAll(extensions);
        }

        this.addListener(this.connection);
        this.events.addListener(EVENTS.Ready, () => {
            this.listeners.forEach((listener) => {
                listener.onReady?.();
            });
        });
        this.listeners.forEach((listener) => {
            listener.onInitialized?.();
        });
    }

    proxy(url: string): string {
        return this.connection.proxy(url);
    }

    asset(url: string): string {
        return this.connection.asset(url);
    }

    onConnect(): void {
        this.send(EVENTS.Connect, this.app);
    }

    onDisconnect(): void {
        if (this.running) {
            this.connection.connect();
        }
    }

    send<T>(event: EventType<T>, data: T): void {
        this.connection.send({
            type: event.type,
            data: event.serializer.serialize(data),
        });
    }

    addListener(listener: ClientListener): void {
        if (this.listeners.includes(listener)) {
            throw new Error('Listener already registered');
        }
        this.listeners.push(listener);
    }

    removeListener(listener: ClientListener): void {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    start(): void {
        if (this.running) {
            throw new Error('Client already running');
        }
        this.running = true;
        this.listeners.forEach((listener) => {
            listener.onStarted?.();
        });
    }

    stop(): void {
        this.running = false;
        this.listeners.forEach((listener) => {
            listener.onStopped?.();
        });
    }
}
