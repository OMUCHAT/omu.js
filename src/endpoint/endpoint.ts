import { Address } from "../connection";
import type { Serializer } from "../interface";


export interface EndpointType<ReqType = any, ResType = any, ReqData = any, ResData = any> {
    type: string;
    serializer: Serializer<ReqType, ReqData, ResType, ResData>;
}


export interface Endpoint {
    readonly address: Address;

    call<D, T>(endpoint: EndpointType<D, T>, data: D): Promise<T>;
}
