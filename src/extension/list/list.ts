import { Keyable } from "src/interface/keyable";

export interface List<T extends Keyable> {
    get(key: string): Promise<T | null>;
    set(...item: T[]): Promise<void>;
    add(...item: T[]): Promise<void>;
    remove(...key: string[]): Promise<void>;
    clear(): Promise<void>;

    on(listener: ListListener<T>): void;
    off(listener: ListListener<T>): void;

    iterator(): AsyncIterator<T>;
    fetch(limit: number, cursor?: string): Promise<Record<string, T>>;
    size(): Promise<number>;
}

export interface ListListener<T extends Keyable> {
    onItemAdd?(items: Record<string, T>): void;
    onItemRemove?(items: string[]): void;
    onItemSet?(items: Record<string, T>): void;
    onItemClear?(): void;
}

export interface ListType<T extends Keyable, D = any> {
    key: string;
    serialize: (item: T) => D;
    deserialize: (data: D) => T | null;
}