import { Keyable } from "src/interface/keyable";

export interface List<T extends Keyable> {
    readonly cache: Map<string, T>;
    get(key: string): Promise<T | null>;
    set(...item: T[]): Promise<void>;
    add(...item: T[]): Promise<void>;
    remove(...items: T[]): Promise<void>;
    clear(): Promise<void>;

    addListener(listener: ListListener<T>): void;
    off(listener: ListListener<T>): void;

    iterator(): AsyncIterator<T>;
    fetch(limit: number, cursor?: string): Promise<Map<string, T>>;
    size(): Promise<number>;
}

export interface ListListener<T extends Keyable> {
    onItemAdd?(items: Map<string, T>): void;
    onItemRemove?(items: string[]): void;
    onItemSet?(items: Map<string, T>): void;
    onItemClear?(): void;
    onCacheUpdate?(cache: Map<string, T>): void;
}

export interface ListType<T extends Keyable, D = any> {
    key: string;
    serialize: (item: T) => D;
    deserialize: (data: D) => T | null;
}