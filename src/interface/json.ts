export type Json = JsonPrimitive | JsonArray | JsonObject;

export type JsonPrimitive = string | number | boolean | null | undefined;

export interface JsonArray extends Array<Json> {}

export interface JsonObject {
    [key: string]: Json;
}

export type AsJson<T> =
    T extends string | number | boolean | null ? T :
    T extends object ? { [K in keyof T]: AsJson<T[K]> } :
    never;
