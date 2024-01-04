import type { AsJson } from './json.js';

export interface Model<T, D = AsJson<T>> {
    toJson(): D;
    toString(): string;
}
