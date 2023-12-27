import type { Json } from './json';

export interface Model<T extends Json> {
    toJson(): T;
    toString(): string;
}
