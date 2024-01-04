import type { App, ExtensionType } from '../extension/index.js';
import { Serializer, type Serializable } from '../interface/index.js';

export type EventData = Uint8Array;

export interface EventMessage {
    type: string;
    data: EventData;
}

export interface EventType<T = any> {
    readonly type: string;
    serializer: Serializable<T, EventData>;
}

export class JsonEventType<T> implements EventType<T> {
    public readonly type: string;
    public serializer: Serializable<T, EventData>;

    constructor({
        owner,
        name,
    }: {
        owner: string;
        name: string;
    }) {
        this.type = `${owner}:${name}`;
        this.serializer = new Serializer<T, EventData>(
            (data) => {
                const json = JSON.stringify(data);
                return new TextEncoder().encode(json);
            },
            (data) => {
                const json = new TextDecoder().decode(data);
                return JSON.parse(json);
            },
        );
    }

    static of<T>(app: App, {
        name,
    }: {
        name: string;
    }): JsonEventType<T> {
        return new JsonEventType<T>({ owner: app.key(), name });
    }

    static ofExtension<T>(extension: ExtensionType, {
        name,
    }: {
        name: string;
    }): JsonEventType<T> {
        return new JsonEventType<T>({ owner: extension.key, name });
    }
}

export class SerializeEventType<T = any> implements EventType<T> {
    public readonly type: string;
    public serializer: Serializable<T, EventData>;

    constructor({
        owner,
        name,
        serializer,
    }: {
        owner: string;
        name: string;
        serializer: Serializable<T, EventData>;
    }) {
        this.type = `${owner}:${name}`;
        this.serializer = serializer;
    }

    static of<T>({
        owner,
        name,
        serializer,
    }: {
        owner: string;
        name: string;
        serializer: Serializable<T, EventData>;
    }): SerializeEventType<T> {
        return new SerializeEventType<T>({ owner, name, serializer });
    }

    static ofExtension<T>({
        extension,
        name,
        serializer,
    }: {
        extension: ExtensionType;
        name: string;
        serializer: Serializable<T, EventData>;
    }): SerializeEventType<T> {
        return new SerializeEventType<T>({ owner: extension.key, name, serializer });
    }
}
