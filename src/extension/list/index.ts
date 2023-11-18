import { type Client } from "../../client";
import { type Keyable, type Model } from "../../interface";
import { defineExtensionType, type Extension, type ExtensionType } from "../extension";

import { type List, type ListListener, type ListType } from "./list";
export * from "./list";


type ListEvent = { type: string; }
export const ListExtensionType: ExtensionType<ListExtension> = defineExtensionType("list", (client: Client) => new ListExtension(client));
export const ListItemAddEvent = ListExtensionType.defineEventType<ListEvent & { items: any[] }>("list_item_add");
export const ListItemRemoveEvent = ListExtensionType.defineEventType<ListEvent & { items: string[] }>("list_item_remove");
export const ListItemSetEvent = ListExtensionType.defineEventType<ListEvent & { items: any[] }>("list_item_set");
export const ListItemClearEvent = ListExtensionType.defineEventType<ListEvent>("list_item_clear");
export const ListItemGetEndpoint = ListExtensionType.defineEndpointType<ListEvent & { items: string[] }, Record<string, any>>("list_item_get");
export const ListItemFetchEndpoint = ListExtensionType.defineEndpointType<ListEvent & { limit: number, cursor?: string }, Record<string, any>>("list_item_fetch");
export const ListItemSizeEndpoint = ListExtensionType.defineEndpointType<ListEvent, number>("list_item_size");


export function defineListType<T extends Keyable, D = any>(extensionType: ExtensionType, key: string, serialize: (item: T) => D, deserialize: (data: D) => T | null): ListType<T, D> {
    return {
        key: `${extensionType.key}:${key}`,
        serialize,
        deserialize,
    };
}

export function defineListTypeModel<T extends Model<D> & Keyable, D>(extensionType: ExtensionType, key: string, deserialize: (data: D) => T): ListType<T, D> {
    return {
        key: `${extensionType.key}:${key}`,
        serialize: (item) => item.json(),
        deserialize,
    };
}


export class ListExtension implements Extension {
    private readonly listMap: Record<string, List<Keyable>>;

    constructor(private readonly client: Client) {
        this.listMap = {};
        client.events.register(ListItemAddEvent, ListItemRemoveEvent, ListItemSetEvent, ListItemClearEvent);
    }

    register<K extends Keyable>(type: ListType<K>): List<K> {
        if (this.listMap[type.key]) {
            throw new Error(`List for key ${type.key} already registered`);
        }
        const list = new ListImpl<K>(this.client, type);
        this.listMap[type.key] = list;
        return list;
    }

    get<K extends Keyable>(key: ListType<K>): List<K> {
        const list = this.listMap[key.key];
        if (!list) {
            throw new Error(`No list for key ${key.key}`);
        }
        return list as List<K>;
    }
}


class ListImpl<T extends Keyable> implements List<T> {
    public cache: Map<string, T>;
    private readonly listeners: ListListener<T>[];

    constructor(
        private readonly client: Client,
        private readonly type: ListType<T>,
    ) {
        this.cache = new Map();
        this.listeners = [];

        this.client.events.on(ListItemAddEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            const items = Object.entries(event.items).map(([key, data]) => {
                const item = this.type.deserialize(data);
                if (!item) {
                    throw new Error(`Failed to deserialize item ${key}`);
                }
                return [key, item];
            });
            const newItems = Object.fromEntries(items);
            this.cache = new Map([...this.cache, ...newItems]);
            this.listeners.forEach((listener) => {
                listener.onItemAdd?.(newItems);
                listener.onCacheUpdate?.(this.cache);
            });
        });
        this.client.events.on(ListItemRemoveEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            const items = event.items;
            items.forEach((key) => {
                const item = this.cache.get(key);
                if (!item) {
                    throw new Error(`No item for key ${key}`);
                }
                this.cache.delete(key);
                return item;
            });
            this.listeners.forEach((listener) => {
                listener.onItemRemove?.(items);
                listener.onCacheUpdate?.(this.cache);
            });
        });
        this.client.events.on(ListItemSetEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            const items = new Map(Object.entries(event.items).map(([key, data]) => {
                const item = this.type.deserialize(data);
                if (!item) {
                    throw new Error(`Failed to deserialize item ${key}`);
                }
                return [key, item];
            }));
            this.cache = new Map([...this.cache, ...items]);
            this.listeners.forEach((listener) => {
                listener.onItemSet?.(items);
                listener.onCacheUpdate?.(this.cache);
            });
        });
        this.client.events.on(ListItemClearEvent, (event) => {
            if (event.type !== this.type.key) {
                return;
            }
            this.cache = new Map();
            this.listeners.forEach((listener) => {
                listener.onItemClear?.();
                listener.onCacheUpdate?.(this.cache);
            });
        });
    }

    on(listener: ListListener<T>): void {
        if (this.listeners.includes(listener)) {
            throw new Error("Listener already registered");
        }
        this.listeners.push(listener);
    }

    off(listener: ListListener<T>): void {
        this.listeners.splice(this.listeners.indexOf(listener), 1);
    }

    async get(key: string): Promise<T | null> {
        if (this.cache.has(key)) {
            return this.cache.get(key) ?? null;
        }
        const res = await this.client.endpoint.call(ListItemGetEndpoint, {
            type: this.type.key,
            items: [key],
        });
        Object.entries(res).forEach(([key, data]) => {
            const item = this.type.deserialize(data);
            if (!item) {
                throw new Error(`Failed to deserialize item ${key}`);
            }
            this.cache.set(key, item);
        });
        return this.cache.get(key) ?? null;
    }

    async set(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serialize(item)];
        }));
        this.client.send(ListItemSetEvent, {
            type: this.type.key,
            items: data,
        });
    }

    async add(...items: T[]): Promise<void> {
        const data = Object.fromEntries(items.map((item) => {
            return [item.key(), this.type.serialize(item)];
        }));
        this.client.send(ListItemAddEvent, {
            type: this.type.key,
            items: data,
        });
    }

    async remove(...keys: string[]): Promise<void> {
        this.client.send(ListItemRemoveEvent, {
            type: this.type.key,
            items: keys,
        });
    }

    async clear(): Promise<void> {
        this.client.send(ListItemClearEvent, {
            type: this.type.key,
        });
    }

    async fetch(limit: number, cursor?: string): Promise<Map<string, T>> {
        const res = await this.client.endpoint.call(ListItemFetchEndpoint, {
            type: this.type.key,
            cursor,
            limit,
        })
        const items = new Map(Object.entries(res).map(([key, data]) => {
            const item = this.type.deserialize(data);
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
        return await this.client.endpoint.call(ListItemSizeEndpoint, {
            type: this.type.key,
        });
    }
}