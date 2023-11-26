import { Client } from "src/client";

import type { ConnectionListener } from "../connection";
import { App, AppJson } from "../extension";
import { Serializer } from "../interface";
import { makeSerializer } from "../interface/serializer";

import type { EventJson, EventType } from "./event";


export interface EventRegistry extends ConnectionListener {
    register(...types: EventType[]): void;
    addListener<T, D>(eventType: EventType<T, D>, listener: (data: T) => void): void;
    removeListener<T, D>(eventType: EventType<T, D>, listener: (data: T) => void): void;
}

export function createEventRegistry(client: Client): EventRegistry {
    const eventMap: Record<string, {
        type: EventType<any, any>;
        listeners: ((data: any) => void)[];
    }> = {};

    function register(...types: EventType<any, any>[]): void {
        types.forEach((type) => {
            if (eventMap[type.type]) {
                throw new Error(`Event type ${type.type} already registered`);
            }
            eventMap[type.type] = {
                type: type,
                listeners: [],
            };
        });
    }

    function addListener<T, D>(eventType: EventType<T, D>, listener: (data: T) => void): void {
        const eventInfo = eventMap[eventType.type];
        if (!eventInfo) {
            throw new Error(`No event for type ${eventType.type}`);
        }
        eventInfo.listeners.push(listener);
    }

    function removeListener<T, D>(eventType: EventType<T, D>, listener: (data: T) => void): void {
        const eventInfo = eventMap[eventType.type];
        if (!eventInfo) {
            throw new Error(`No event for type ${eventType.type}`);
        }
        eventInfo.listeners.splice(eventInfo.listeners.indexOf(listener), 1);
    }

    function onEvent(eventJson: EventJson<any>): void {
        const event = eventMap[eventJson.type];
        if (!event) {
            console.warn(`Received unknown event type ${eventJson.type}`);
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

function defineEvent<T, D>(type: string, serializer: Serializer<T, D>): EventType<T, D> {
    return {
        type,
        serializer,
    };
}

export const EVENTS = {
    Connect: defineEvent<App, { app: AppJson }>("Connect", makeSerializer({
        serialize(item) {
            return {
                app: item.json(),
            };
        },
        deserialize(data) {
            return App.fromJson(data.app);
        },
    })),
    Ready: defineEvent<undefined, undefined>("Ready", makeSerializer({})),
}
