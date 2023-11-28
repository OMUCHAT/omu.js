import type { Model } from './model';

export interface Serializable<T, D> {
    serialize(data: T): D;
    deserialize(data: D): T;
}

export class Serializer<T, D> {
    constructor(
        public serialize: (data: T) => D,
        public deserialize: (data: D) => T,
    ) {}

    static noop<T>(): Serializable<T, T> {
        return new Serializer<T, T>((data) => data, (data) => data);
    }

    static model<M extends Model<D>, D>(model: (data: D) => M): Serializable<M, D> {
        return new Serializer<M, D>((data) => data.json(), model);
    }
}
