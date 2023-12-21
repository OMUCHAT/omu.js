import type { Model } from '../../interface';
import type { Keyable } from '../../interface/keyable';
import { Serializer, type Serializable } from '../../interface/serializable';

import type { TableInfo } from './model/table-info';

export interface Table<T extends Keyable> {
    readonly info: TableInfo;
    readonly cache: Map<string, T>;
    get(key: string): Promise<T | undefined>;
    getMany(keys: string[]): Promise<Map<string, T>>;
    add(...item: T[]): Promise<void>;
    set(...item: T[]): Promise<void>;
    remove(...items: T[]): Promise<void>;
    clear(): Promise<void>;

    fetch(limit: number, cursor?: string): Promise<Map<string, T>>;
    iter(): AsyncIterator<T>;
    size(): Promise<number>;

    addListener(listener: TableListener<T>): void;
    removeListener(listener: TableListener<T>): void;
    listen(listener?: (items: Map<string, T>) => void): () => void;

    proxy(proxy: (item: T) => T | null): () => void;
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

export class ModelTableType<T extends Keyable & Model<D>, D = unknown> implements TableType<T, D> {
    public readonly info: TableInfo;
    public readonly serializer: Serializable<T, D>;

    constructor(
        info: TableInfo,
        model: { fromJson(data: D): T },
    ) {
        this.info = info;
        this.serializer = Serializer.model(model);
    }
}
