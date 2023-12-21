import type { Client } from '../../client';
import { ExtensionEventType } from '../../event';
import { Serializer, type Keyable } from '../../interface';
import { SerializeEndpointType } from '../endpoint';
import { EndpointInfo } from '../endpoint/model';
import type { Extension, ExtensionType } from '../extension';
import { defineExtensionType } from '../extension';
import { ExtensionInfo } from '../server/model/extension-info';

import { TableInfo } from './model/table-info';
import type { Table, TableListener, TableType } from './table';
import { ModelTableType } from './table';

export const TableExtensionType: ExtensionType<TableExtension> = defineExtensionType(ExtensionInfo.create('table'), (client: Client) => new TableExtension(client));
type TableEventData = { type: string; }
type TableItemsEventData = TableEventData & { items: Record<string, any> };
type TableProxyEventData = TableEventData & { items: Record<string, any>, key: number };
export const TableRegisterEvent = new ExtensionEventType<TableInfo>(TableExtensionType, 'register', Serializer.model(TableInfo));
export const TableListenEvent = new ExtensionEventType<string>(TableExtensionType, 'listen', Serializer.noop());
export const TableProxyListenEvent = new ExtensionEventType<string>(TableExtensionType, 'proxy_listen', Serializer.noop());
export const TableProxyEvent = new ExtensionEventType<TableProxyEventData>(TableExtensionType, 'proxy', Serializer.noop());
export const TableProxyEndpoint = new SerializeEndpointType<TableProxyEventData>(EndpointInfo.create(TableExtensionType, 'proxy'));

export const TableItemAddEvent = new ExtensionEventType<TableItemsEventData>(TableExtensionType, 'item_add', Serializer.noop());
export const TableItemUpdateEvent = new ExtensionEventType<TableItemsEventData>(TableExtensionType, 'item_update', Serializer.noop());
export const TableItemRemoveEvent = new ExtensionEventType<TableItemsEventData>(TableExtensionType, 'item_remove', Serializer.noop());
export const TableItemClearEvent = new ExtensionEventType<TableEventData>(TableExtensionType, 'item_clear', Serializer.noop());
export const TableItemGetEndpoint = new SerializeEndpointType<TableEventData & { items: string[] }, Record<string, any>>(EndpointInfo.create(TableExtensionType, 'item_get'));
export const TableItemFetchEndpoint = new SerializeEndpointType<TableEventData & { limit: number, cursor?: string }, Record<string, any>>(EndpointInfo.create(TableExtensionType, 'item_fetch'));
export const TableItemSizeEndpoint = new SerializeEndpointType<TableEventData, number>(EndpointInfo.create(TableExtensionType, 'item_size'));
export const TablesTableType = new ModelTableType(TableInfo.ofExtension(TableExtensionType, 'tables'), TableInfo);

export class TableExtension implements Extension {
    private readonly tableMap: Map<string, Table<any>>;
    public readonly tables: Table<TableInfo>;

    constructor(private readonly client: Client) {
        this.tableMap = new Map();
        client.events.register(TableRegisterEvent, TableProxyEvent, TableProxyListenEvent, TableListenEvent, TableItemAddEvent, TableItemRemoveEvent, TableItemUpdateEvent, TableItemClearEvent);
        this.tables = this.get(TablesTableType);
    }

    register<T extends Keyable>(type: TableType<T>): Table<T> {
        if (this.has(type)) {
            throw new Error(`Table for key ${type.info.key()} already registered`);
        }
        const table = new TableImpl<T>(this.client, type, true);
        this.tableMap.set(type.info.key(), table);
        return table as Table<T>;
    }

    get<T extends Keyable>(type: TableType<T>): Table<T> {
        if (this.has(type)) {
            return this.tableMap.get(type.info.key()) as Table<T>;
        }
        const table = new TableImpl<T>(this.client, type, false);
        this.tableMap.set(type.info.key(), table);
        return table as Table<T>;
    }

    has<K extends Keyable>(type: TableType<K>): boolean {
        return this.tableMap.has(type.info.key());
    }
}

class TableImpl<T extends Keyable> implements Table<T> {
    public readonly info: TableInfo;
    public cache: Map<string, T>;
    private readonly listeners: TableListener<T>[];
    private readonly proxies: Array<(item: T) => T | null>;
    private readonly key: string;
    private listening: boolean;
    private cacheSize?: number;

    constructor(
        private readonly client: Client,
        private readonly type: TableType<T>,
        private readonly owner: boolean,
    ) {
        this.cache = new Map();
        this.listeners = [];
        this.proxies = [];
        this.info = type.info;
        this.key = type.info.key();
        this.listening = false;

        client.connection.addListener(this);
        client.events.addListener(TableProxyEvent, (event) => {
            if (event.type !== this.key) {
                return;
            }
            let items = this.parseItems(event.items);
            this.proxies.forEach((proxy) => {
                items = new Map([...items.entries()].map(([key, item]) => {
                    const proxyItem = proxy(item);
                    if (proxyItem) {
                        return [key, proxyItem];
                    }
                    return undefined;
                }).filter((item): item is [string, T] => {
                    return typeof item !== 'undefined';
                }));
            });
            client.endpoints.invoke(TableProxyEndpoint, {
                type: this.key,
                key: event.key,
                items: Object.fromEntries([...items.entries()].map(([key, item]) => {
                    return [key, this.type.serializer.serialize(item)];
                })),
            });
        });
        client.events.addListener(TableItemAddEvent, (event) => {
            if (event.type !== this.key) {
                return;
            }
            const items = this.parseItems(event.items);
            this.updateCache(items);
            this.listeners.forEach((listener) => {
                listener.onAdd?.(items);
            });
        });
        client.events.addListener(TableItemUpdateEvent, (event) => {
            if (event.type !== this.key) {
                return;
            }
            const items = this.parseItems(event.items);
            this.updateCache(items);
            this.listeners.forEach((listener) => {
                listener.onSet?.(items);
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

    private updateCache(items: Map<string, T>): void {
        if (!this.cacheSize) {
            this.cache = new Map([...this.cache, ...items]);
        } else {
            const cache = new Map([...this.cache, ...items].slice(-this.cacheSize));
            this.cache = cache;
        }
        this.listeners.forEach((listener) => {
            listener.onCacheUpdate?.(this.cache);
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

    listen(listener?: (items: Map<string, T>) => void): () => void {
        this.listening = true;
        if (!listener) {
            return () => {};
        }
        const tableListener = {
            onCacheUpdate: listener,
        };
        this.addListener(tableListener);
        return () => {
            this.removeListener(tableListener);
        };
    }

    proxy(callback: (item: T) => T | null): () => void {
        this.proxies.push(callback);
        return () => {
            this.proxies.splice(this.proxies.indexOf(callback), 1);
        };
    }

    onConnect(): void {
        if (this.owner) {
            this.client.send(TableRegisterEvent, this.info);
        }
        if (this.listening) {
            this.client.send(TableListenEvent, this.key);
        }
        if (this.proxies.length > 0) {
            this.client.send(TableProxyListenEvent, this.key);
        }
    }

    async get(key: string): Promise<T | undefined> {
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        const res = await this.client.endpoints.invoke(TableItemGetEndpoint, {
            type: this.key,
            items: [key],
        });
        const items = this.parseItems(res.items);
        this.updateCache(items);
        return this.cache.get(key);
    }

    async getMany(keys: string[]): Promise<Map<string, T>> {
        const res = await this.client.endpoints.invoke(TableItemGetEndpoint, {
            type: this.key,
            items: keys,
        });
        const items = this.parseItems(res.items);
        this.updateCache(items);
        return items;
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
        this.client.send(TableItemUpdateEvent, {
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
        const res = await this.client.endpoints.invoke(TableItemFetchEndpoint, {
            type: this.key,
            cursor,
            limit,
        });
        const items = this.parseItems(res);
        this.updateCache(items);
        return items;
    }

    async *iter(): AsyncIterator<T> {
        const cursor: string | undefined = undefined;
        let items: Map<string, T> = await this.fetch(100, cursor);
        yield* items.values();
        while (items.size > 0) {
            items = await this.fetch(100, cursor);
            yield* items.values();
        }
    }

    async size(): Promise<number> {
        return await this.client.endpoints.invoke(TableItemSizeEndpoint, {
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

    setCacheSize(size: number): void {
        this.cacheSize = size;
    }
}
