import type { EndpointInfo } from 'src/extension/server/model/endpoint-info';

import type { Address } from '../connection';
import { Serializer, type Serializable } from '../interface/serializable';

export interface EndpointType<Req = unknown, Res = unknown, ReqData = unknown, ResData = unknown> {
    info: EndpointInfo;
    requestSerializer: Serializable<Req, ReqData>;
    responseSerializer: Serializable<Res, ResData>;
}

export class ClientEndpointType<Req = unknown, Res = unknown> implements EndpointType<Req, Res, any, any> {
    public info: EndpointInfo;
    public requestSerializer: Serializable<Req, any>;
    public responseSerializer: Serializable<Res, any>;

    constructor(info: EndpointInfo, requestSerializer?: Serializable<Req, any>, responseSerializer?: Serializable<Res, any>) {
        this.info = info;
        this.requestSerializer = requestSerializer ?? Serializer.noop();
        this.responseSerializer = responseSerializer ?? Serializer.noop();
    }
}

export interface Endpoint {
    readonly address: Address;

    execute<Req, Res, ReqData, ResData>(endpoint: EndpointType<Req, Res, ReqData, ResData>, data: Req): Promise<Res>;
}
