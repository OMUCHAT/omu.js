import { ServerAddress } from "../connection/connection";

export interface EndpointType<ReqType = any, ResType = any, ReqData = any, ResData = any> {
    type: string;
    serialize(data: ReqType): ReqData;
    deserialize(data: ResData): ResType;
}


export interface Endpoint {
    readonly address: ServerAddress;

    call<D, T>(endpoint: EndpointType<D, T>, data: D): Promise<T>;
}