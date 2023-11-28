import axios from 'axios';

import type { Address } from '../connection';

import type { Endpoint, EndpointType } from './endpoint';

export class HttpEndpoint implements Endpoint {
    readonly address: Address;

    constructor(address: Address) {
        this.address = address;
    }

    async execute<Req, Res, ReqData, ResData>(endpoint: EndpointType<Req, Res, ReqData, ResData>, data: Req): Promise<Res> {
        const endpointUrl = this._endpointUrl(endpoint);
        const json = endpoint.requestSerializer.serialize(data);
        try {
            const response = await axios.post<ResData>(endpointUrl, json);
            return endpoint.responseSerializer.deserialize(response.data);
        } catch (e) {
            throw new Error(`Failed to execute endpoint ${endpoint.info.key()}: ${e}`);
        }
    }

    private _endpointUrl(endpoint: EndpointType): string {
        const protocol = this.address.secure ? 'https' : 'http';
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/api/v1/${endpoint.info.key()}`;
    }
}
