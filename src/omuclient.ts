import { type Client, type ClientListener } from "./client";
import { type Connection, type ConnectionListener } from "./connection";
import { HttpEndpoint, type Endpoint } from "./endpoint";
import { EVENTS, type EventRegistry, type EventType } from "./event";
import { createEventRegistry } from "./event/event-registry";
import { ChatExtensionType, ListExtensionType, ServerExtensionType, createExtensionRegistry, type App, type Extension, type ExtensionRegistry, type ExtensionType } from "./extension";

export class OmuClient implements Client, ConnectionListener {
    readonly app: App;
    readonly connection: Connection;
    readonly endpoint: Endpoint;
    readonly events: EventRegistry;
    readonly extensions: ExtensionRegistry;
    readonly listeners: ClientListener[];
    public running: boolean;

    constructor(options: {
        app: App;
        connection: Connection;
        endpoint?: Endpoint;
        eventsRegistry?: EventRegistry;
        extensionRegistry?: ExtensionRegistry;
        extensions?: ExtensionType<Extension>[];
    }) {
        const { app, connection, endpoint, eventsRegistry, extensionRegistry, extensions } = options;
        this.app = app;
        this.connection = connection;
        this.endpoint = endpoint ?? new HttpEndpoint(connection.address);

        this.listeners = [];
        this.events = eventsRegistry ?? createEventRegistry();
        this.extensions = extensionRegistry ?? createExtensionRegistry(this);
        this.extensions.register(ListExtensionType, ServerExtensionType, ChatExtensionType);
        if (extensions) {
            this.extensions.register(...extensions);
        }

        connection.addListener(this);
        connection.addListener(this.events);
        this.addListener(connection);

        this.running = false;
        this.listeners.forEach((listener) => {
            listener.onInitialized?.();
        });
    }

    onConnect(): void {
        this.send(EVENTS.Connect, this.app);
    }

    onDisconnect(): void {
        if (this.running) {
            this.connection.connect();
        }
    }

    send<D, T>(event: EventType<D, T>, data: T): void {
        this.connection.send({
            type: event.type,
            data: event.serialize(data),
        });
    }

    addListener(listener: ClientListener): void {
        if (this.listeners.includes(listener)) {
            throw new Error("Listener already registered");
        }
        this.listeners.push(listener);
    }

    removeListener(listener: ClientListener): void {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    start() {
        this.running = true;
        this.listeners.forEach((listener) => {
            listener.onStarted?.();
        })
    }

    stop() {
        this.running = false;
        this.listeners.forEach((listener) => {
            listener.onStopped?.();
        })
    }
}