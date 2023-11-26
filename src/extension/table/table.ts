import { ExtensionType } from "src/extension";
import { Model, Serializer } from "src/interface";
import { Keyable } from "src/interface/keyable";

import { makeSerializer } from "../../interface/serializer";


export interface Table<T extends Keyable> {
    readonly cache: Map<string, T>;
    get(key: string): Promise<T | null>;
    add(...item: T[]): Promise<void>;
    set(...item: T[]): Promise<void>;
    remove(...items: T[]): Promise<void>;
    clear(): Promise<void>;

    fetch(limit: number, cursor?: string): Promise<Map<string, T>>;
    iterator(): AsyncIterator<T>;
    size(): Promise<number>;

    addListener(listener: TableListener<T>): void;
    removeListener(listener: TableListener<T>): void;
}

export interface TableListener<T extends Keyable> {
    onAdd?(items: Map<string, T>): void;
    onSet?(items: Map<string, T>): void;
    onRemove?(items: Map<string, T>): void;
    onClear?(): void;
    onCacheUpdate?(cache: Map<string, T>): void;
}

export interface TableType<T extends Keyable, D = any> {
    key: string;
    serializer: Serializer<T, D, T | null>;
}

export function defineTableType<T extends Keyable, D = any>(extensionType: ExtensionType, key: string, serializer: Serializer<T, D, T | null>): TableType<T, D> {
    return {
        key: `${extensionType.key}:${key}`,
        serializer,
    };
}

export function defineTableTypeModel<T extends Model<D> & Keyable, D>(extensionType: ExtensionType, key: string, deserialize: (data: D) => T): TableType<T, D> {
    return {
        key: `${extensionType.key}:${key}`,
        serializer: makeSerializer({ serialize: (item) => item.json(), deserialize }),
    };
}