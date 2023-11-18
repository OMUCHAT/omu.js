import type { ConnectionListener } from "../connection/connection";
import { App, AppJson } from "../extension/server/model/app";
import type { EventType } from "./event";

export interface EventRegistry extends ConnectionListener {
    register(...event: EventType[]): void;
    on<T>(event: EventType<T>, listener: (data: T) => void): void;
    off<T>(event: EventType<T>, listener: (data: T) => void): void;
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