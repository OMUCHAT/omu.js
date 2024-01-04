import type { EventData } from '../../event/event.js';
import type { Json } from '../../index.js';
import { Serializer, type Serializable } from '../../interface/serializable.js';
import type { ExtensionType } from '../extension.js';
import type { App } from '../server/index.js';

import { EndpointInfo } from './model/index.js';

export interface EndpointType<Req = unknown, Res = unknown> {
    info: EndpointInfo;
    type: string;
    requestSerializer: Serializable<Req, EventData>;
    responseSerializer: Serializable<Res, EventData>;
}

export class SerializeEndpointType<Req = unknown, Res = unknown> implements EndpointType<Req, Res> {
    public info: EndpointInfo;
    public type: string;
    public requestSerializer: Serializable<Req, EventData>;
    public responseSerializer: Serializable<Res, EventData>;

    private constructor({
        info,
        requestSerializer,
        responseSerializer,
    }: {
        info: EndpointInfo;
        requestSerializer: Serializable<Req, EventData>;
        responseSerializer: Serializable<Res, EventData>;
    }) {
        this.info = info;
        this.type = info.key();
        this.requestSerializer = requestSerializer;
        this.responseSerializer = responseSerializer;
    }

    static of<Req, Res>(app: App, {
        name,
        requestSerializer,
        responseSerializer,
    }: {
        name: string;
        requestSerializer: Serializable<Req, EventData>;
        responseSerializer: Serializable<Res, EventData>;
    }): SerializeEndpointType<Req, Res> {
        return new SerializeEndpointType<Req, Res>({
            info: new EndpointInfo(app.key(), name),
            requestSerializer,
            responseSerializer,
        });
    }

    static ofExtension<Req, Res>(extension: ExtensionType, {
        name,
        requestSerializer,
        responseSerializer,
    }: {
        name: string;
        requestSerializer: Serializable<Req, EventData>;
        responseSerializer: Serializable<Res, EventData>;
    }): SerializeEndpointType<Req, Res> {
        return new SerializeEndpointType<Req, Res>({
            info: new EndpointInfo(extension.key, name),
            requestSerializer,
            responseSerializer,
        });
    }
}

export class JsonEndpointType<Req, Res> implements EndpointType<Req, Res> {
    public info: EndpointInfo;
    public type: string;
    public requestSerializer: Serializable<Req, EventData>;
    public responseSerializer: Serializable<Res, EventData>;

    constructor({
        info,
        requestSerializer,
        responseSerializer,
    }: {
        info: EndpointInfo;
        requestSerializer: Serializable<Req, Json>;
        responseSerializer: Serializable<Res, Json>;
    }) {
        this.info = info;
        this.type = info.key();
        this.requestSerializer = Serializer.builder<Req>()
            .pipe(requestSerializer)
            .pipe(Serializer.json())
            .pipe(Serializer.textBytes())
            .build();
        this.responseSerializer = Serializer.builder<Res>()
            .pipe(responseSerializer)
            .pipe(Serializer.json())
            .pipe(Serializer.textBytes())
            .build();
    }

    static of<Req, Res>(app: App, {
        name,
        requestSerializer,
        responseSerializer,
    }: {
        name: string;
        requestSerializer: Serializable<Req, Json>;
        responseSerializer: Serializable<Res, Json>;
    }): JsonEndpointType<Req, Res> {
        return new JsonEndpointType<Req, Res>({
            info: new EndpointInfo(app.key(), name),
            requestSerializer,
            responseSerializer,
        });
    }

    static ofExtension<Req, Res>(extension: ExtensionType, {
        name,
        requestSerializer,
        responseSerializer,
    }: {
        name: string;
        requestSerializer: Serializable<Req, Json>;
        responseSerializer: Serializable<Res, Json>;
    }): JsonEndpointType<Req, Res> {
        return new JsonEndpointType<Req, Res>({
            info: new EndpointInfo(extension.key, name),
            requestSerializer,
            responseSerializer,
        });
    }
}
