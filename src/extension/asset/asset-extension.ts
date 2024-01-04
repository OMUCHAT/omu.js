
import type { Client } from '../../client/index.js';
import { Serializer } from '../../interface/index.js';
import { SerializeEndpointType } from '../endpoint/endpoint.js';
import { defineExtensionType } from '../extension.js';
import { ExtensionInfo } from '../server/model/extension-info.js';

export const AssetExtensionType = defineExtensionType({
    info: ExtensionInfo.create('asset'),
    create: (client: Client) => new AssetExtension(client),
});

interface PutEvent {
    type: 'put';
    key: string;
    data: any;
}

export const AssetPutEndpoint = SerializeEndpointType.ofExtension<PutEvent, boolean>(AssetExtensionType, {
    name: 'put',
    requestSerializer: new Serializer<PutEvent, Uint8Array>(
        (data) => {
            const json = JSON.stringify(data);
            return new TextEncoder().encode(json);
        },
        (data) => {
            const json = new TextDecoder().decode(data);
            return JSON.parse(json);
        },
    ),
    responseSerializer: Serializer.pipe(Serializer.json(), Serializer.textBytes()),
});

export class AssetExtension {
    constructor(private readonly client: Client) {
    }

    put(key: string, data: any): void {
    }
}
