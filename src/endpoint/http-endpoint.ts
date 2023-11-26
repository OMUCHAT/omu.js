import axios from "axios";

import { Address } from "../connection";

import { Endpoint, EndpointType } from "./endpoint";

export class HttpEndpoint implements Endpoint {
    readonly address: Address;

    constructor(address: Address) {
        this.address = address;
    }

    async execute<Req, Res>(endpoint: EndpointType<Req, Res>, data: Req): Promise<Res> {
        const endpointUrl = this._endpointUrl(endpoint);
        const json = endpoint.serializer.serialize(data);
        try {
            const response = await axios.post(endpointUrl, json);
            return endpoint.serializer.deserialize(response.data);
        } catch (e) {
            throw new Error(`Failed to execute endpoint ${endpoint.key}: ${e}`);
        }
    }

    private _endpointUrl(endpoint: EndpointType): string {
        const protocol = this.address.secure ? "https" : "http";
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/api/v1/${endpoint.key}`;
    }

}