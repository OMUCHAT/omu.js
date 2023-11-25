import { type Client } from "src/client/client";
import { type EndpointType } from "src/endpoint";
import { type EventType } from "src/event";

export interface Extension {
}

export interface ExtensionType<T extends Extension = Extension> {
    key: string;
    create: (client: Client) => T;
    defineEventTypeSerialize<D, T = D>(type: string, serialize: (event: T) => D, deserialize: (data: D) => T): EventType<D, T>;
    defineEventType<T>(type: string): EventType<T, T>;
    defineEndpointSerialize<Req, Res = Req, ReqData = any, ResData = any>(type: string, serialize: (data: Req) => ReqData, deserialize: (data: ResData) => Res): EndpointType<Req, Res, ReqData, ResData>;
    defineEndpointType<Req, Res>(type: string): EndpointType<Req, Res>;
    dependencies: () => ExtensionType[];
}

export function defineExtensionType<T extends Extension>(key: string, create: (client: Client) => T, dependencies?: () => ExtensionType[]): ExtensionType<T> {
    return {
        key,
        create,
        defineEventTypeSerialize<D, T = D>(type: string, serialize: (event: T) => D, deserialize: (data: D) => T): EventType<D, T> {
            return {
                type: `${key}:${type}`,
                serialize: serialize,
                deserialize: deserialize,
            };
        },
        defineEventType<T>(type: string): EventType<T, T> {
            return {
                type: `${key}:${type}`,
                serialize: (event) => event,
                deserialize: (data) => data,
            };
        },
        defineEndpointSerialize<Req, Res = Req, ReqData = any, ResData = any>(type: string, serialize: (data: Req) => ReqData, deserialize: (data: ResData) => Res): EndpointType<Req, Res, ReqData, ResData> {
            return {
                type: `${key}:${type}`,
                serialize: serialize,
                deserialize: deserialize,
            };
        },
        defineEndpointType<Req, Res>(type: string): EndpointType<Req, Res> {
            return {
                type: `${key}:${type}`,
                serialize: (data) => data,
                deserialize: (data) => data,
            };
        },
        dependencies: dependencies ?? (() => []),
    };
}