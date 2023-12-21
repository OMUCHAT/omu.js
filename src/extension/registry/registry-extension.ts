import type { Client } from 'src/client';
import type { ConnectionListener } from 'src/connection';

import { ExtensionEventType } from '../../event';
import { Serializer } from '../../interface';
import { SerializeEndpointType } from '../endpoint';
import { EndpointInfo } from '../endpoint/model';
import type { Extension, ExtensionType } from '../extension';
import { defineExtensionType } from '../extension';
import { ExtensionInfo } from '../server/model/extension-info';

export const RegistryExtensionType: ExtensionType<RegistryExtension> = defineExtensionType(ExtensionInfo.create('registry'), (client: Client) => new RegistryExtension(client));
export const RegistryUpdateEvent = new ExtensionEventType<{ key: string, value: any }>(RegistryExtensionType, 'update', Serializer.noop());
export const RegistryListenEvent = new ExtensionEventType<string>(RegistryExtensionType, 'listen', Serializer.noop());
export const RegistryGetEndpoint = new SerializeEndpointType<string, any>(EndpointInfo.create(RegistryExtensionType, 'get'));

type Key = { name: string, app?: string };

export class RegistryExtension implements Extension, ConnectionListener {
    private readonly listenKeys: Set<string> = new Set();

    constructor(private readonly client: Client) {
        client.events.register(RegistryUpdateEvent);
        client.connection.addListener(this);
    }

    async get<T>(key: Key): Promise<T> {
        return await this.client.endpoints.invoke(
            RegistryGetEndpoint,
            `${key.app ?? this.client.app.key()}:${key.name}`,
        ) as T;
    }

    set<T>(key: Key, value: T): void {
        this.client.send(RegistryUpdateEvent, {
            key: `${key.app ?? this.client.app.key()}:${key.name}`,
            value,
        });
    }

    listen<T>(key: Key, handler: (value: T) => void): () => void {
        const keyString = `${key.app ?? this.client.app.key()}:${key.name}`;
        this.listenKeys.add(keyString);
        const listener = (event: { key: string; value: any; }): void => {
            if (event.key === keyString) {
                handler(event.value);
            }
        };
        this.client.events.addListener(RegistryUpdateEvent, listener);
        return () => {
            this.client.events.removeListener(RegistryUpdateEvent, listener);
        };
    }

    onConnect(): void {
        this.listenKeys.forEach((key) => {
            this.client.send(RegistryListenEvent, key);
        });
    }
}
