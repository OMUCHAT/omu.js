import type { Keyable } from 'src/interface/keyable';
import type { Serializable } from 'src/interface/serializable';

import type { TableInfo } from './model/table-info';

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

export interface TableType<T extends Keyable, D = unknown> {
    info: TableInfo;
    serializer: Serializable<T, D>;
}

export class ModelTableType<T extends Keyable, D = unknown> implements TableType<T, D> {
    constructor(
        public readonly info: TableInfo,
        public readonly serializer: Serializable<T, D>,
    ) {}
}
