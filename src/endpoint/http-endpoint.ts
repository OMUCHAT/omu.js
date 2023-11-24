import axios from "axios";
import { Address } from "src/connection/connection";

import { Endpoint, EndpointType } from "./endpoint";

export class HttpEndpoint implements Endpoint {
    readonly address: Address;

    constructor(address: Address) {
        this.address = address;
    }

    async call<D, T>(endpoint: EndpointType<D, T>, data: D): Promise<T> {
        const endpointUrl = this.getEndpoint(endpoint);
        const postData = endpoint.serialize(data);
        try {
            const response = await axios.post(endpointUrl, postData);
            return endpoint.deserialize(response.data);
        } catch (e) {
            throw new Error(`Failed to call endpoint ${endpoint.type}: ${e}`);
        }
    }

    private getEndpoint(endpoint: EndpointType): string {
        const protocol = this.address.secure ? "https" : "http";
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/api/v1/${endpoint.type}`;
    }

}