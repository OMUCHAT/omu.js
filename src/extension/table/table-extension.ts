
import type { Client } from 'src/client';

import { ClientEndpointType } from '../../endpoint';
import { ExtensionEventType } from '../../event';
import { Serializer, type Keyable } from '../../interface';
import type { Extension, ExtensionType } from '../extension';
import { defineExtensionType } from '../extension';
import { EndpointInfo } from '../server/model/endpoint-info';
import { ExtensionInfo } from '../server/model/extension-info';

import type { TableInfoJson } from './model/table-info';
import { TableInfo } from './model/table-info';
import type { Table, TableListener, TableType } from './table';
import { ModelTableType } from './table';

export const TableExtensionType: ExtensionType<TableExtension> = defineExtensionType(ExtensionInfo.create('table'), (client: Client) => new TableExtension(client));
type TableEvent = { type: string; }
export const TableRegisterEvent = new ExtensionEventType<TableInfo>(TableExtensionType, 'register', Serializer.model(TableInfo.fromJson));
export const TableItemAddEvent = new ExtensionEventType<TableEvent & { items: Record<string, any> }>(TableExtensionType, 'item_add', Serializer.noop());
export const TableItemSetEvent = new ExtensionEventType<TableEvent & { items: Record<string, any> }>(TableExtensionType, 'item_set', Serializer.noop());
export const TableItemRemoveEvent = new ExtensionEventType<TableEvent & { items: Record<string, any> }>(TableExtensionType, 'item_remove', Serializer.noop());
export const TableItemClearEvent = new ExtensionEventType<TableEvent>(TableExtensionType, 'item_clear', Serializer.noop());
export const TableItemGetEndpoint = new ClientEndpointType<TableEvent & { items: string[] }, Record<string, any>>(EndpointInfo.create(TableExtensionType, 'item_get'));
export const TableItemFetchEndpoint = new ClientEndpointType<TableEvent & { limit: number, cursor?: string }, Record<string, any>>(EndpointInfo.create(TableExtensionType, 'item_fetch'));
export const TableItemSizeEndpoint = new ClientEndpointType<TableEvent, number>(EndpointInfo.create(TableExtensionType, 'item_size'));
export const TablesTableType = new ModelTableType<TableInfo, TableInfoJson>(new TableInfo('table', 'tables'), Serializer.model(TableInfo.fromJson));

export class TableExtension implements Extension {
    private readonly tableMap: Map<string, Table<Keyable>>;
    public readonly tables: Table<TableInfo>;

    constructor(private readonly client: Client) {
        this.tableMap = new Map();
        client.events.register(TableRegisterEvent, TableItemAddEvent, TableItemRemoveEvent, TableItemSetEvent, TableItemClearEvent);
        this.tables = this.register(TablesTableType);
    }

    register<K extends Keyable>(type: TableType<K>): Table<K> {
        if (this.tableMap.has(type.info.key())) {
            throw new Error(`Table for key ${type.info.key()} already registered`);
        }
        const table = new TableImpl<K>(this.client, type);
        this.tableMap.set(type.info.key(), table);
        return table;
    }

    get<K extends Keyable>(type: TableType<K>): Table<K> {
        const table = this.tableMap.get(type.info.key());
        return table as Table<K>;
    }
}

class TableImpl<T extends Keyable> implements Table<T> {
    public cache: Map<string, T>;
    private readonly listeners: TableListener<T>[];
    private readonly key: string;

    constructor(
        private readonly client: Client,
        private readonly type: TableType<T>,
    ) {
        this.cache = new Map();
        this.listeners = [];
        this.key = type.info.key();

        client.connection.addListener({
            onConnect() {
                client.send(TableRegisterEvent, type.info);
            },
        });
        client.events.addListener(TableItemAddEvent, (event) => {
            if (event.type !== this.key) {
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
            if (event.type !== this.key) {
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
            if (event.type !== this.key) {
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
            if (event.type !== this.key) {
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
            throw new Error('Listener already registered');
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
            type: this.key,
            items: [key],
        });
        Object.entries(res).forEach(([key, data]) => {
            const item = this.type.serializer.deserialize(data);
            this.cache.set(key, item);
        });
        return this.cache.get(key) ?? null;
    }

    async add(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serializer.serialize(item)];
        }));
        this.client.send(TableItemAddEvent, {
            type: this.key,
            items: data,
        });
    }

    async set(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serializer.serialize(item)];
        }));
        this.client.send(TableItemSetEvent, {
            type: this.key,
            items: data,
        });
    }

    async remove(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serializer.serialize(item)];
        }));
        this.client.send(TableItemRemoveEvent, {
            type: this.key,
            items: data,
        });
    }

    async clear(): Promise<void> {
        this.client.send(TableItemClearEvent, {
            type: this.key,
        });
    }

    async fetch(limit: number, cursor?: string): Promise<Map<string, T>> {
        const res = await this.client.endpoint.execute(TableItemFetchEndpoint, {
            type: this.key,
            cursor,
            limit,
        });
        const items = new Map(Object.entries(res).map(([key, data]) => {
            const item = this.type.serializer.deserialize(data);
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
        let items: Map<string, T> = await this.fetch(100, cursor);
        yield* items.values();
        while (items.size > 0) {
            items = await this.fetch(100, cursor);
            yield* items.values();
        }
    }

    async size(): Promise<number> {
        return await this.client.endpoint.execute(TableItemSizeEndpoint, {
            type: this.key,
        });
    }

    private parseItems(items: Record<string, T>): Map<string, T> {
        return new Map(Object.entries(items).map(([key, data]) => {
            const item = this.type.serializer.deserialize(data);
            this.cache.set(key, item);
            return [key, item];
        }));
    }
}
