import type { Json } from './json';

export interface Model<T extends Json> {
    json(): T;
    toString(): string;
}
