import axios from "axios";
import { ServerAddress } from "src/connection/connection";
import { Endpoint, EndpointType } from "./endpoint";

export class HttpEndpoint implements Endpoint {
    readonly address: ServerAddress;

    constructor(address: ServerAddress) {
        this.address = address;
    }

    async call<D, T>(endpoint: EndpointType<D, T>, data: D): Promise<T> {
        const response = await axios.post(this.getEndpoint(endpoint), endpoint.serialize(data));
        return endpoint.deserialize(response.data);
    }

    private getEndpoint(endpoint: EndpointType): string {
        const protocol = this.address.secure ? "https" : "http";
        const { host, port } = this.address;
        return `${protocol}://${host}:${port}/api/v1/${endpoint.type}`;
    }

}