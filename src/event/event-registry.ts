
import type { Client } from '../client/index.js';

import type { EventMessage, EventType } from './event.js';

export interface EventRegistry {
    register(...types: EventType[]): void;
    addListener<T>(eventType: EventType<T>, listener: (event: T) => void): void;
    removeListener(eventType: EventType, listener: (event: any) => void): void;
}

interface EventEntry<T = unknown> {
    type: EventType<T>;
    listeners: ((data: T) => void)[];
}

export function createEventRegistry(client: Client): EventRegistry {
    const eventMap: Map<string, EventEntry> = new Map();

    function register(...types: EventType<unknown>[]): void {
        types.forEach((type) => {
            if (eventMap.has(type.type)) {
                throw new Error(`Event type ${type.type} already registered`);
            }
            eventMap.set(type.type, {
                type: type,
                listeners: [],
            });
        });
    }

    function addListener<T, D>(eventType: EventType<T>, listener: (event: T) => void): void {
        const eventInfo = eventMap.get(eventType.type) as EventEntry<T> | undefined;
        if (!eventInfo) {
            throw new Error(`No event for type ${eventType.type}`);
        }
        eventInfo.listeners.push(listener);
    }

    function removeListener(eventType: EventType, listener: (event: any) => void): void {
        const eventInfo = eventMap.get(eventType.type);
        if (!eventInfo) {
            throw new Error(`No event for type ${eventType.type}`);
        }
        eventInfo.listeners.splice(eventInfo.listeners.indexOf(listener), 1);
    }

    function onEvent(eventJson: EventMessage): void {
        const event = eventMap.get(eventJson.type);
        if (!event) {
            console.warn(`Received unknown event type ${eventJson.type}`);
            console.debug(eventMap);
            return;
        }
        const data = event.type.serializer.deserialize(eventJson.data);
        event.listeners.forEach((listener) => {
            listener(data);
        });
    }

    const registry = {
        register,
        addListener,
        removeListener,
        onEvent,
    };
    client.connection.addListener(registry);
    return registry;
}

