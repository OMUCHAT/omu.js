import type { ConnectionListener } from "../connection/connection";
import { App, AppJson } from "../extension/server/model/app";

import type { EventType } from "./event";

import { type EventData } from ".";

export interface EventRegistry extends ConnectionListener {
    register(...event: EventType[]): void;
    addListener<D, T>(event: EventType<D, T>, listener: (data: T) => void): void;
    removeListener<D, T>(event: EventType<D, T>, listener: (data: T) => void): void;
}

export function createEventRegistry(): EventRegistry {
    const eventMap: Record<string, {
        event: EventType<any, any>;
        listeners: ((data: any) => void)[];
    }> = {};

    function register(...event: EventType<any, any>[]): void {
        event.forEach((event) => {
            if (eventMap[event.type]) {
                throw new Error(`Event type ${event.type} already registered`);
            }
            eventMap[event.type] = {
                event,
                listeners: [],
            };
        });
    }

    function on<D, T>(event: EventType<D, T>, listener: (data: T) => void): void {
        const eventInfo = eventMap[event.type];
        if (!eventInfo) {
            throw new Error(`No event for type ${event.type}`);
        }
        eventInfo.listeners.push(listener);
    }

    function off<D, T>(event: EventType<D, T>, listener: (data: T) => void): void {
        const eventInfo = eventMap[event.type];
        if (!eventInfo) {
            throw new Error(`No event for type ${event.type}`);
        }
        eventInfo.listeners.splice(eventInfo.listeners.indexOf(listener), 1);
    }

    function onEvent(eventData: EventData<any>): void {
        const event = eventMap[eventData.type];
        if (!event) {
            console.warn(`No event for type ${eventData.type}`);
            console.debug(eventMap);
            return;
        }
        const data = event.event.deserialize(eventData.data);
        event.listeners.forEach((listener) => {
            listener(data);
        });
    }

    return {
        register,
        addListener: on,
        removeListener: off,
        onEvent,
    };
}

function defineEvent<D, T>(type: string, serializer: (event: T) => D, deserializer: (data: D) => T): EventType<D, T> {
    return {
        type,
        serialize: serializer,
        deserialize: deserializer,
    };
}

export const EVENTS = {
    Connect: defineEvent<{ app: AppJson }, App>("Connect", (event) => {
        return { app: event }
    }, (data) => new App(data.app)),
    Ready: defineEvent<undefined, undefined>("Ready", () => undefined, () => undefined),
}