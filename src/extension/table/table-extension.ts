import { Client } from "src/client";
import { Keyable } from "src/interface";

import { makeSerializer } from "../../interface/serializer";
import { Extension, ExtensionType, defineExtensionType } from "../extension";


import { Table, TableListener, TableType } from "./table";

export const TableExtensionType: ExtensionType<TableExtension> = defineExtensionType("table", (client: Client) => new TableExtension(client));
type TableEvent = { type: string; }
export const TableItemAddEvent = TableExtensionType.defineEventType<TableEvent & { items: Record<string, any> }>("item_add", makeSerializer({}));
export const TableItemSetEvent = TableExtensionType.defineEventType<TableEvent & { items: Record<string, any> }>("item_set", makeSerializer({}));
export const TableItemRemoveEvent = TableExtensionType.defineEventType<TableEvent & { items: Record<string, any> }>("item_remove", makeSerializer({}));
export const TableItemClearEvent = TableExtensionType.defineEventType<TableEvent>("item_clear", makeSerializer({}));
export const TableItemGetEndpoint = TableExtensionType.defineEndpointType<TableEvent & { items: string[] }, Record<string, any>>("item_get", makeSerializer({}));
export const TableItemFetchEndpoint = TableExtensionType.defineEndpointType<TableEvent & { limit: number, cursor?: string }, Record<string, any>>("item_fetch", makeSerializer({}));
export const TableItemSizeEndpoint = TableExtensionType.defineEndpointType<TableEvent, number>("item_size", makeSerializer({}));


export class TableExtension implements Extension {
    private readonly tableMap: Record<string, Table<Keyable>>;

    constructor(private readonly client: Client) {
        this.tableMap = {};
        client.events.register(TableItemAddEvent, TableItemRemoveEvent, TableItemSetEvent, TableItemClearEvent);
    }

    register<K extends Keyable>(type: TableType<K>): Table<K> {
        if (this.tableMap[type.key]) {
            throw new Error(`Table for key ${type.key} already registered`);
        }
        const table = new TableImpl<K>(this.client, type);
        this.tableMap[type.key] = table;
        return table;
    }

    get<K extends Keyable>(key: TableType<K>): Table<K> {
        const table = this.tableMap[key.key];
        if (!table) {
            throw new Error(`Table for key ${key.key} not registered`);
        }
        return table as Table<K>;
    }
}


class TableImpl<T extends Keyable> implements Table<T> {
    public cache: Map<string, T>;
    private readonly listeners: TableListener<T>[];

    constructor(
        private readonly client: Client,
        private readonly type: TableType<T>,
    ) {
        this.cache = new Map();
        this.listeners = [];

        client.events.addListener(TableItemAddEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            const items = this.parseItems(event.items);
            this.cache = new Map([...this.cache, ...items]);
            this.listeners.forEach((listener) => {
                listener.onAdd?.(items);
                listener.onCacheUpdate?.(this.cache);
            });
        });
        client.events.addListener(TableItemSetEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            const items = this.parseItems(event.items);
            this.cache = new Map([...this.cache, ...items]);
            this.listeners.forEach((listener) => {
                listener.onSet?.(items);
                listener.onCacheUpdate?.(this.cache);
            });
        });
        client.events.addListener(TableItemRemoveEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            const items = this.parseItems(event.items);
            items.forEach((_, key) => {
                this.cache.delete(key);
            });
            this.listeners.forEach((listener) => {
                listener.onRemove?.(items);
                listener.onCacheUpdate?.(this.cache);
            });
        });
        client.events.addListener(TableItemClearEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            this.cache = new Map();
            this.listeners.forEach((listener) => {
                listener.onClear?.();
                listener.onCacheUpdate?.(this.cache);
            });
        });
    }

    addListener(listener: TableListener<T>): void {
        if (this.listeners.includes(listener)) {
            throw new Error("Listener already registered");
        }
        this.listeners.push(listener);
    }

    removeListener(listener: TableListener<T>): void {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    async get(key: string): Promise<T | null> {
        if (this.cache.has(key)) {
            return this.cache.get(key) ?? null;
        }
        const res = await this.client.endpoint.execute(TableItemGetEndpoint, {
            type: this.type.key,
            items: [key],
        });
        Object.entries(res).forEach(([key, data]) => {
            const item = this.type.serializer.deserialize(data);
            if (!item) {
                throw new Error(`Failed to deserialize item ${key}`);
            }
            this.cache.set(key, item);
        });
        return this.cache.get(key) ?? null;
    }

    async add(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serializer.serialize(item)];
        }));
        this.client.send(TableItemAddEvent, {
            type: this.type.key,
            items: data,
        });
    }

    async set(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serializer.serialize(item)];
        }));
        this.client.send(TableItemSetEvent, {
            type: this.type.key,
            items: data,
        });
    }

    async remove(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serializer.serialize(item)];
        }));
        this.client.send(TableItemRemoveEvent, {
            type: this.type.key,
            items: data,
        });
    }

    async clear(): Promise<void> {
        this.client.send(TableItemClearEvent, {
            type: this.type.key,
        });
    }

    async fetch(limit: number, cursor?: string): Promise<Map<string, T>> {
        const res = await this.client.endpoint.execute(TableItemFetchEndpoint, {
            type: this.type.key,
            cursor,
            limit,
        })
        const items = new Map(Object.entries(res).map(([key, data]) => {
            const item = this.type.serializer.deserialize(data);
            if (!item) {
                throw new Error(`Failed to deserialize item ${key}`);
            }
            this.cache.set(key, item);
            return [key, item];
        }));
        this.listeners.forEach((listener) => {
            listener.onCacheUpdate?.(this.cache);
        });
        return items;
    }

    async *iterator(): AsyncIterator<T> {
        const cursor: string | undefined = undefined;
        let items: Map<string, T> = new Map();
        while (true) {
            items = await this.fetch(100, cursor);
            if (Object.keys(items).length === 0) {
                break;
            }
            yield* Object.values(items);
        }
    }

    async size(): Promise<number> {
        return await this.client.endpoint.execute(TableItemSizeEndpoint, {
            type: this.type.key,
        });
    }

    private parseItems(items: Record<string, T>): Map<string, T> {
        return new Map(Object.entries(items).map(([key, data]) => {
            const item = this.type.serializer.deserialize(data);
            if (!item) {
                throw new Error(`Failed to deserialize item ${key}`);
            }
            this.cache.set(key, item);
            return [key, item];
        }));
    }
}