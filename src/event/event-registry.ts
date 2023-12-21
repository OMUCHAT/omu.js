
import type { Client } from '../client';
import { App } from '../extension';
import type { Serializable } from '../interface/serializable';
import { Serializer } from '../interface/serializable';

import type { EventJson, EventType } from './event';

export interface EventRegistry {
    register(...types: EventType[]): void;
    addListener<T, D>(eventType: EventType<T, D>, listener: (event: T) => void): void;
    removeListener(eventType: EventType, listener: (event: any) => void): void;
}

interface EventEntry<T = unknown, D = unknown> {
    type: EventType<T, D>;
    listeners: ((data: T) => void)[];
}

export function createEventRegistry(client: Client): EventRegistry {
    const eventMap: Map<string, EventEntry> = new Map();

    function register(...types: EventType<unknown, unknown>[]): void {
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

    function addListener<T, D>(eventType: EventType<T, D>, listener: (event: T) => void): void {
        const eventInfo = eventMap.get(eventType.type) as EventEntry<T, D> | undefined;
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

    function onEvent(eventJson: EventJson<unknown>): void {
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

function defineEvent<T, D>(type: string, serializer: Serializable<T, D>): EventType<T, D> {
    return {
        type,
        serializer,
    };
}

export const EVENTS = {
    Connect: defineEvent('connect', Serializer.model(App)),
    Ready: defineEvent<undefined, undefined>('ready', Serializer.noop()),
};
