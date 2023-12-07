import type { Client } from 'src/client';

import { ExtensionEventType } from '../../event';
import { Serializer } from '../../interface';
import { defineExtensionType, type ExtensionType } from '../extension';
import { ExtensionInfo } from '../server';
import type { Table } from '../table';
import { ModelTableType, TableInfo } from '../table';

import type { EndpointType } from './endpoint';
import type { EndpointInfo, EndpointInfoJson } from './model';

export const EndpointExtensionType: ExtensionType<EndpointExtension> = defineExtensionType(ExtensionInfo.create('endpoint'), (client: Client) => new EndpointExtension(client), () => []);

export const EndpointRegisterEvent = new ExtensionEventType<EndpointInfo>(EndpointExtensionType, 'register', Serializer.model(TableInfo.fromJson));
type EndpointEvent = {
    type: string;
    key: number;
}
export const EndpointCallEvent = new ExtensionEventType<EndpointEvent & { data: any }>(EndpointExtensionType, 'call', Serializer.noop());
export const EndpointReceiveEvent = new ExtensionEventType<EndpointEvent & { data: any }>(EndpointExtensionType, 'receive', Serializer.noop());
export const EndpointErrorEvent = new ExtensionEventType<EndpointEvent & { error: string }>(EndpointExtensionType, 'error', Serializer.noop());
export const EndpointsTableType = new ModelTableType<EndpointInfo, EndpointInfoJson>(TableInfo.create(EndpointExtensionType, 'endpoints'), Serializer.model(TableInfo.fromJson));

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
        this.endpoints = this.client.tables.register(EndpointsTableType);
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

    register<Req, Res, ReqData, ResData>(type: EndpointType<Req, Res, ReqData, ResData>): void {
        if (this.endpointMap.has(type.info.key())) {
            throw new Error(`Endpoint for key ${type.info.key()} already registered`);
        }
        this.endpointMap.set(type.info.key(), type);
    }

    async call<Req, Res, ReqData, ResData>(endpoint: EndpointType<Req, Res, ReqData, ResData>, data: Req): Promise<Res> {
        const json = endpoint.requestSerializer.serialize(data);
        try {
            const response = await this._call(endpoint, json);
            return endpoint.responseSerializer.deserialize(response);
        } catch (e) {
            throw new Error(`Failed to execute endpoint ${endpoint.info.key()}: ${e}`);
        }
    }

    private _call<Req, Res, ReqData, ResData>(endpoint: EndpointType<Req, Res, ReqData, ResData>, data: ReqData): Promise<ResData> {
        const key = this.key++;
        const promise = new Promise<ResData>((resolve, reject) => {
            this.promiseMap.set(key, { resolve, reject });
        });
        this.client.send(EndpointCallEvent, { type: endpoint.info.key(), key, data });
        return promise;
    }
}
