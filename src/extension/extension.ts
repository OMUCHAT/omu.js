import { Serializer } from "src/interface";

import { type Client } from "../client";
import { type EndpointType } from "../endpoint";
import { type EventType } from "../event";


export interface Extension {
}

export interface ExtensionType<T extends Extension = Extension> {
    key: string;
    create: (client: Client) => T;
    defineEventType<D, T = D>(type: string, serializer: Serializer<D, T>): EventType<D, T>;
    defineEndpointType<Req, Res = Req, ReqData = any, ResData = any>(type: string, serializer: Serializer<Req, ReqData, Res, ResData>): EndpointType<Req, Res, ReqData, ResData>;
    dependencies: () => ExtensionType[];
}

export function defineExtensionType<T extends Extension>(key: string, create: (client: Client) => T, dependencies?: () => ExtensionType[]): ExtensionType<T> {
    return {
        key,
        create,
        defineEventType: (type, serializer) => ({
            type: `${key}:${type}`,
            serializer,
        }),
        defineEndpointType: (type, serializer) => ({
            key: `${key}:${type}`,
            serializer
        }),
        dependencies: dependencies ?? (() => []),
    };
}