import type { AsJson } from './json.js';
import type { Model } from './model.js';

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

    static json<T>(): Serializable<T, string> {
        return new Serializer<T, string>((data) => JSON.stringify(data), (data) => JSON.parse(data));
    }

    static textBytes(): Serializable<string, Uint8Array> {
        return new Serializer<string, Uint8Array>(
            (data) => new TextEncoder().encode(data),
            (data) => new TextDecoder().decode(data),
        );
    }

    static modelBytes<M extends Model<_D>, _D, D = AsJson<_D>>(model: { fromJson(data: D): M }): Serializable<M, Uint8Array> {
        return this.pipe(this.pipe(this.model(model), this.json()), this.textBytes());
    }

    static model<M extends Model<_D>, _D, D extends AsJson<_D>>(model: { fromJson(data: D): M }): Serializable<M, D> {
        return new Serializer<M, D>((data) => data.toJson(), model.fromJson);
    }

    static array<T, D>(serializer: Serializable<T, D>): Serializable<T[], D[]> {
        return new Serializer<T[], D[]>(
            (data) => data.map((item) => serializer.serialize(item)),
            (data) => data.map((item) => serializer.deserialize(item)),
        );
    }

    static map<V, D>(serializer: Serializable<V, D>): Serializable<Map<string, V>, Map<string, D>> {
        return new Serializer<Map<string, V>, Map<string, D>>(
            (data) => {
                const result = new Map<string, D>();
                data.forEach((value, key) => {
                    result.set(key, serializer.serialize(value));
                });
                return result;
            },
            (data) => {
                const result = new Map<string, V>();
                data.forEach((value, key) => {
                    result.set(key, serializer.deserialize(value));
                });
                return result;
            },
        );
    }

    static pipe<T, A, B>(a: Serializable<T, A>, b: Serializable<A, B>): Serializable<T, B> {
        return new Serializer<T, B>(
            (data) => b.serialize(a.serialize(data)),
            (data) => a.deserialize(b.deserialize(data)),
        );
    }

    static builder<T>(): SerializerBuilder<T, T> {
        return new NoopSerializerBuilder<T>();
    }
}

interface SerializerBuilder<T, D> {
    pipe<A>(serializer: Serializable<D, A>): SerializerBuilder<T, A>;
    build(): Serializable<T, D>;
}

export class PipeSerializerBuilder<T, D> implements SerializerBuilder<T, D> {
    private readonly serializer: Serializable<T, D>;

    constructor(serializer: Serializable<T, D>) {
        this.serializer = serializer;
    }

    pipe<A>(serializer: Serializable<D, A>): SerializerBuilder<T, A> {
        return new PipeSerializerBuilder<T, A>(Serializer.pipe(this.serializer, serializer));
    }

    build(): Serializable<T, D> {
        return this.serializer;
    }
}

export class NoopSerializerBuilder<T> implements SerializerBuilder<T, T> {
    pipe<A>(serializer: Serializable<T, A>): SerializerBuilder<T, A> {
        return new PipeSerializerBuilder<T, A>(serializer);
    }

    build(): Serializable<T, T> {
        return Serializer.noop();
    }
}
