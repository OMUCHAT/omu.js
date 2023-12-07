import { Serializer, type Serializable } from '../../interface/serializable';

import type { EndpointInfo } from './model';

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
