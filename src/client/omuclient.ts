import type { Address, Connection, ConnectionListener } from '../connection/index.js';
import { WebsocketConnection } from '../connection/websocket-connection.js';
import type { EventRegistry, EventType } from '../event/index.js';
import { EVENTS, createEventRegistry } from '../event/index.js';
import type { AssetExtension } from '../extension/asset/asset-extension.js';
import { AssetExtensionType } from '../extension/asset/asset-extension.js';
import type { EndpointExtension } from '../extension/endpoint/endpoint-extension.js';
import { EndpointExtensionType } from '../extension/endpoint/endpoint-extension.js';
import { createExtensionRegistry, type ExtensionRegistry } from '../extension/extension-registry.js';
import type { Extension, ExtensionType } from '../extension/extension.js';
import type { MessageExtension } from '../extension/message/message-extension.js';
import { MessageExtensionType } from '../extension/message/message-extension.js';
import type { RegistryExtension } from '../extension/registry/registry-extension.js';
import { RegistryExtensionType } from '../extension/registry/registry-extension.js';
import type { App, ServerExtension } from '../extension/server/index.js';
import { ServerExtensionType } from '../extension/server/index.js';
import type { TableExtension } from '../extension/table/table-extension.js';
import { TableExtensionType } from '../extension/table/table-extension.js';

import type { Client, ClientListener } from './client.js';

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
    readonly assets: AssetExtension;
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
        this.connection = connection ?? new WebsocketConnection(this);
        this.connection.addListener(this);
        this.events = eventsRegistry ?? createEventRegistry(this);
        this.extensions = extensionRegistry ?? createExtensionRegistry(this);

        this.events.register(EVENTS.Ready);
        this.tables = this.extensions.register(TableExtensionType);
        this.endpoints = this.extensions.register(EndpointExtensionType);
        this.server = this.extensions.register(ServerExtensionType);
        this.registry = this.extensions.register(RegistryExtensionType);
        this.message = this.extensions.register(MessageExtensionType);
        this.assets = this.extensions.register(AssetExtensionType);
        if (extensions) {
            this.extensions.registerAll(extensions);
        }

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

    send<T, D>(event: EventType<T, D>, data: T): void {
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
