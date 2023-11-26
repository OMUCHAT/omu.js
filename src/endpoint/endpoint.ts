import { Address } from "../connection";
import type { Serializer } from "../interface";


export interface EndpointType<ReqType = any, ResType = any, ReqData = any, ResData = any> {
    key: string;
    serializer: Serializer<ReqType, ReqData, ResType, ResData>;
}


export interface Endpoint {
    readonly address: Address;

    execute<D, T>(type: EndpointType<D, T>, data: D): Promise<T>;
}
