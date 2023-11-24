export interface EventJson<T = any> {
    readonly type: string;
    readonly data: T;
}

export interface EventType<D = any, T = any> {
    readonly type: string;
    serialize(event: T): D;
    deserialize(data: D): T | null;
}
