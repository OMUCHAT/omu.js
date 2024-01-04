import type { Client } from '../../client/index.js';
import { JsonEventType } from '../../event/index.js';
import { defineExtensionType } from '../extension.js';
import { ExtensionInfo } from '../server/index.js';
import type { Table } from '../table/index.js';
import { ModelTableType } from '../table/index.js';

import { JsonEndpointType, type EndpointType } from './endpoint.js';
import { EndpointInfo } from './model/index.js';

export const EndpointExtensionType = defineExtensionType({
    info: ExtensionInfo.create('endpoint'),
    create: (client: Client) => new EndpointExtension(client),
});

export const EndpointRegisterEvent = JsonEventType.ofExtension<EndpointInfo>(EndpointExtensionType, {
    name: 'register',
});
type EndpointEvent = {
    type: string;
    key: number;
}
export const EndpointCallEvent = JsonEventType.ofExtension<EndpointEvent & { data: any }>(EndpointExtensionType, {
    name: 'call',
});
export const EndpointReceiveEvent = JsonEventType.ofExtension<EndpointEvent & { data: any }>(EndpointExtensionType, {
    name: 'receive',
});
export const EndpointErrorEvent = JsonEventType.ofExtension<EndpointEvent & { error: string }>(EndpointExtensionType, {
    name: 'error',
});
export const EndpointsTableType = ModelTableType.ofExtension(EndpointExtensionType, {
    name: 'endpoints',
    model: EndpointInfo,
});

type CallFuture = {
    resolve: (data: any) => void;
    reject: (error: Error) => void;
}

export class EndpointExtension {
    private readonly endpointMap: Map<string, EndpointType>;
    public readonly endpoints: Table<EndpointInfo>;
    private readonly promiseMap: Map<number, CallFuture>;
    private key: number;

    constructor(private readonly client: Client) {
        this.endpointMap = new Map();
        this.promiseMap = new Map();
        this.endpoints = this.client.tables.get(EndpointsTableType);
        this.key = 0;
        client.events.register(EndpointRegisterEvent, EndpointCallEvent, EndpointReceiveEvent, EndpointErrorEvent);
        client.events.addListener(EndpointReceiveEvent, (event) => {
            const promise = this.promiseMap.get(event.key);
            if (!promise) return;
            this.promiseMap.delete(event.key);
            promise.resolve(event.data);
        });
        client.events.addListener(EndpointErrorEvent, (event) => {
            const promise = this.promiseMap.get(event.key);
            if (!promise) return;
            this.promiseMap.delete(event.key);
            promise.reject(new Error(event.error));
        });
    }

    register<Req, Res>(type: EndpointType<Req, Res>): void {
        if (this.endpointMap.has(type.type)) {
            throw new Error(`Endpoint for key ${type.type} already registered`);
        }
        this.endpointMap.set(type.type, type);
    }

    async call<Req, Res>(key: { name: string, app: string }, data: Req): Promise<Res> {
        const info = new EndpointInfo(key.app, key.name);
        return await this.invoke<Req, Res>(new JsonEndpointType(info), data);
    }

    async invoke<Req, Res>(endpoint: EndpointType<Req, Res>, data: Req): Promise<Res> {
        const json = endpoint.requestSerializer.serialize(data);
        try {
            const response = await this._call(endpoint, json);
            return endpoint.responseSerializer.deserialize(response);
        } catch (e) {
            throw new Error(`Failed to execute endpoint ${endpoint.type}: ${e}`);
        }
    }

    private _call<Req, Res>(endpoint: EndpointType<Req, Res>, data: Uint8Array): Promise<Uint8Array> {
        const key = this.key++;
        const promise = new Promise<Uint8Array>((resolve, reject) => {
            this.promiseMap.set(key, { resolve, reject });
        });
        this.client.send(EndpointCallEvent, { type: endpoint.type, key, data });
        return promise;
    }
}
