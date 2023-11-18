import { type Client, type ClientListener } from "./client";
import { type Connection, type ConnectionListener } from "./connection";
import { HttpEndpoint, type Endpoint } from "./endpoint";
import { EVENTS, type EventData, type EventRegistry, type EventType } from "./event";
import { App, ChatExtensionType, ListExtensionType, ServerExtensionType, type Extension, type ExtensionRegistry, type ExtensionType } from "./extension";
export * from "./client";
export * from "./extension";

class EventRegistryImpl implements EventRegistry {
    private readonly eventMap: Record<string, {
        event: EventType<any, any>;
        listeners: ((data: any) => void)[];
    }>;

    constructor() {
        this.eventMap = {};
        Object.values(EVENTS).forEach((event) => {
            this.register(event);
        });
    }

    register(...event: EventType<any, any>[]): void {
        event.forEach((event) => {
            if (this.eventMap[event.type]) {
                throw new Error(`Event type ${event.type} already registered`);
            }
            this.eventMap[event.type] = {
                event,
                listeners: [],
            };
        });
    }

    on<T>(event: EventType<T>, listener: (data: T) => void): void {
        const eventInfo = this.eventMap[event.type];
        if (!eventInfo) {
            throw new Error(`No event for type ${event.type}`);
        }
        eventInfo.listeners.push(listener);
    }

    off<T>(event: EventType<T>, listener: (data: T) => void): void {
        const eventInfo = this.eventMap[event.type];
        if (!eventInfo) {
            throw new Error(`No event for type ${event.type}`);
        }
        eventInfo.listeners.splice(eventInfo.listeners.indexOf(listener), 1);
    }

    onEvent(eventData: EventData<any>): void {
        const event = this.eventMap[eventData.type];
        if (!event) {
            console.warn(`No event for type ${eventData.type}`);
            console.debug(this.eventMap);
            return;
        }
        const data = event.event.deserialize(eventData.data);
        event.listeners.forEach((listener) => {
            listener(data);
        });
    }
}

class ExtensionRegistryImpl implements ExtensionRegistry {
    private readonly extensionMap: Record<string, Extension>;

    constructor(private readonly client: Client) {
        this.extensionMap = {};
    }

    register(...extensionType: ExtensionType<Extension>[]): void {
        extensionType.forEach((type) => {
            if (this.has(type)) {
                throw new Error(`Extension type ${type.key} already registered`);
            }
            type.dependencies().forEach((dependency) => {
                if (!this.has(dependency)) {
                    throw new Error(`Extension type ${type.key} depends on ${dependency.key} which is not registered`);
                }
            });
            this.extensionMap[type.key] = type.factory(this.client);
        });
    }

    has<T extends Extension>(extensionType: ExtensionType<T>): boolean {
        return !!this.extensionMap[extensionType.key];
    }

    get<T extends Extension>(extensionType: ExtensionType<T>): T {
        const extension = this.extensionMap[extensionType.key];
        if (!extension) {
            throw new Error(`No extension for type ${extensionType.key}`);
        }
        return extension as T;
    }
}

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
        this.events = eventsRegistry ?? new EventRegistryImpl();
        this.extensions = extensionRegistry ?? new ExtensionRegistryImpl(this);
        this.extensions.register(ListExtensionType, ServerExtensionType, ChatExtensionType);
        if (extensions) {
            this.extensions.register(...extensions);
        }

        connection.on(this);
        connection.on(this.events);
        this.on(connection);

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

    on(listener: ClientListener): void {
        if (this.listeners.includes(listener)) {
            throw new Error("Listener already registered");
        }
        this.listeners.push(listener);
    }

    off(listener: ClientListener): void {
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
