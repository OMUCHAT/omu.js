import { Model } from "./model";

export interface Serializer<T, D, T2 = T, D2 = D> {
    serialize(item: T): D;
    deserialize(data: D2): T2;
}

export function makeModelSerializer<T extends Model<D>, D>(deserializer: (data: D) => T): Serializer<T, D> {
    return {
        serialize: (item) => item.json(),
        deserialize: (data) => deserializer(data)
    };
}

export function makeSerializer<T, D, T2 = any, D2 = any>({ serialize, deserialize }: { serialize?: (item: T) => D, deserialize?: (data: D2) => T2 }): Serializer<T, D, T2, D2> {
    return {
        serialize: serialize || ((item) => item as any),
        deserialize: deserialize || ((data) => data as any)
    };
}